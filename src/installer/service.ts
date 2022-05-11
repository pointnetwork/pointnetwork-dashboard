import { BrowserWindow } from 'electron'
import helpers from '../../shared/helpers'
import Logger from '../../shared/logger'
import Firefox from '../firefox'
import Node from '../node'
import Uninstaller from '../uninstaller'
import { InstallationStepsEnum } from '../@types/installation'
import { getProgressFromGithubMsg } from './helpers'

const path = require('path')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const fs = require('fs')

const POINT_SRC_DIR = helpers.getPointSrcPath()
const POINT_LIVE_DIR = helpers.getLiveDirectoryPath()

const DIRECTORIES = [helpers.getPointSoftwarePath(), POINT_LIVE_DIR]

const REPOSITORIES = ['liveprofile']

class Installer {
  private logger: Logger
  private window: BrowserWindow
  private firefox: Firefox
  private node: Node
  private uninstaller: Uninstaller
  private static installationJsonFilePath: string = path.join(
    helpers.getPointPath(),
    'installer.json'
  )

  constructor(window: BrowserWindow) {
    this.logger = new Logger({ window, channel: 'installer' })
    this.window = window
    this.firefox = new Firefox(window)
    this.node = new Node(window)
    this.uninstaller = new Uninstaller(window)
  }

  static isInstalled = () => {
    try {
      return JSON.parse(
        fs.readFileSync(this.installationJsonFilePath, {
          encoding: 'utf8',
          flag: 'r',
        })
      ).isInstalled
    } catch (error) {
      return false
    }
  }

  createWindow = async () => {}

  start = async () => {
    if (Installer.isInstalled()) {
      await this.upgrade()
    } else {
      await this.install()
    }
  }

  install = async () => {
    this.logger.info('Starting installation')

    // Create the appropriate directories
    this.logger.info(
      `${InstallationStepsEnum.DIRECTORIES}:1`,
      'Creating directories'
    )

    DIRECTORIES.forEach(dir => {
      const total = DIRECTORIES.length
      let created = 0

      try {
        this.logger.info(InstallationStepsEnum.DIRECTORIES, 'Creating:', dir)
        fs.mkdirSync(dir, { recursive: true })
        created++
        const progress = Math.round((created / total) * 100)
        this.logger.info(
          `${InstallationStepsEnum.DIRECTORIES}:${progress}`,
          'Created:',
          dir
        )
      } catch (error) {
        this.logger.error(error)
      }
    })

    // Create a json file and set `isInstalled` flag to false
    fs.writeFileSync(
      Installer.installationJsonFilePath,
      JSON.stringify({ isInstalled: false })
    )

    this.logger.info(
      `${InstallationStepsEnum.DIRECTORIES}:100`,
      'Created required directories'
    )

    // Clone the repos
    this.logger.info(InstallationStepsEnum.CODE, 'Cloning the repositores')
    await Promise.all(
      REPOSITORIES.map(async repo => {
        const dir = path.join(POINT_SRC_DIR, repo)
        const url = `https://github.com/pointnetwork/${repo}`
        await this.firefox.getIdExtension()
        this.logger.info(InstallationStepsEnum.CODE, 'Cloning', url)
        await git.clone({
          fs,
          http,
          dir,
          url,
          depth: 1,
          onMessage: (msg: string) => {
            const progressData = getProgressFromGithubMsg(msg)
            if (progressData) {
              const cap = 90 // Don't go to 100% since there are further steps.
              const progress =
                progressData.progress <= cap ? progressData.progress : cap

              this.logger.info(
                `${InstallationStepsEnum.CODE}:${progress}`,
                progressData.message
              )
            } else {
              this.logger.info(msg)
            }
          },
        })
        this.logger.info(InstallationStepsEnum.CODE, 'Cloned', url)
        this.logger.info(InstallationStepsEnum.CODE, 'Copying liveprofile')
        helpers.copyFolderRecursiveSync(dir, POINT_LIVE_DIR)
        this.logger.info(
          `${InstallationStepsEnum.CODE}:99`,
          'Copied liveprofile'
        )
      })
    )

    this.logger.info(`${InstallationStepsEnum.CODE}:100`, 'Cloned repositories')
    await this.uninstaller.download()
    await this.firefox.downloadInstallPointSDK()
    await this.firefox.download()
    await this.node.download()
    await this.node.download()

    // Get and set the referral code
    const downloadDir = path.join(helpers.getHomePath(), 'Downloads')
    const downloadDirContent = fs.readdirSync(downloadDir)
    // Make sure it's one of our file downloads and pick the first one
    const matchDir = downloadDirContent
      .filter(
        (dir: string) =>
          dir.includes('point-') &&
          (dir.includes('Linux-Debian-Ubuntu') ||
            dir.includes('Linux-RPM-Centos-Fedora') ||
            dir.includes('MacOS-installer') ||
            dir.includes('Windows-installer'))
      )
      .map((dir: string) => path.join(helpers.getHomePath(), dir))[0]
    let requiredDir, referralCode
    if (matchDir) {
      // Strip the file extension
      requiredDir = matchDir
        .replace('.tar.gz', '')
        .replace('.zip', '')
        .replace('.tar', '')
        .replace(/\(\d+\)+/g, '')
        .trim()
      // Get the referral code
      referralCode = Number(requiredDir.slice(requiredDir.length - 12))
    } else {
      referralCode = NaN
    }
    // Save that referral code in ~/.point/infoReferral.json
    fs.writeFileSync(
      path.join(helpers.getPointPath(), 'infoReferral.json'),
      JSON.stringify({
        // Makes sure the referralCode is actually a number
        referralCode: Number.isNaN(referralCode)
          ? null
          : // and that it's greater than 0
          referralCode < 0
          ? null
          : referralCode,
        isRedeemed: false,
      })
    )
    // Set the `isInstalled` flag to true
    fs.writeFileSync(
      Installer.installationJsonFilePath,
      JSON.stringify({ isInstalled: true })
    )
    this.logger.info('Installation complete')
  }

  close() {
    this.window.close()
  }

  upgrade = async () => {
    this.logger.info('Already installed')

    // Pull the latest code
    this.logger.info(InstallationStepsEnum.CODE, 'Pulling the repositories')
    await Promise.all(
      REPOSITORIES.map(async repo => {
        this.logger.info(InstallationStepsEnum.CODE, 'Pulling', repo)

        const dir = path.join(POINT_SRC_DIR, repo)
        await git.pull({
          fs,
          http,
          dir,
          author: { name: 'PointNetwork', email: 'pn@pointnetwork.io' },
        })
      })
    )

    this.logger.info(InstallationStepsEnum.CODE, 'Pull Complete')
  }
}

export default Installer
