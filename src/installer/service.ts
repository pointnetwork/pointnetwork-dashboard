import { BrowserWindow } from 'electron'
import helpers from '../../shared/helpers'
import Logger from '../../shared/logger'
import Firefox from '../firefox'
import Node from '../node'
import Uninstaller from '../uninstaller'
import { InstallationStepsEnum } from '../@types/installation'
import { getProgressFromGithubMsg } from './helpers'
import axios from 'axios'
import rimraf from 'rimraf'

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

    // Get and set the referral code
    let trashDir
    let trashDirContent = []

    this.logger.info(
      InstallationStepsEnum.REFERRAL_CODE,
      'Beginning the process to check the referralCode'
    )
    if (global.platform.darwin) {
      try {
        this.logger.info(
          InstallationStepsEnum.REFERRAL_CODE,
          'Reading ".Trash" directory'
        )
        trashDir = path.join(helpers.getHomePath(), '.Trash')
        trashDirContent = fs.readdirSync(trashDir)
        this.logger.info(
          InstallationStepsEnum.REFERRAL_CODE,
          '".Trash" directory read'
        )
      } catch (e) {
        this.logger.info(
          InstallationStepsEnum.REFERRAL_CODE,
          'Not allowed to read ".Trash" directory'
        )
      }
    }

    let downloadDir
    let downloadDirContent = []

    try {
      this.logger.info(
        InstallationStepsEnum.REFERRAL_CODE,
        'Reading "Downloads" directory'
      )
      downloadDir = path.join(helpers.getHomePath(), 'Downloads')
      downloadDirContent = fs.readdirSync(downloadDir)
      this.logger.info(
        InstallationStepsEnum.REFERRAL_CODE,
        '"Downloads" directory read'
      )
    } catch (e) {
      this.logger.info(
        InstallationStepsEnum.REFERRAL_CODE,
        'Not allowed to read "Downloads" directory'
      )
    }

    let desktopDir
    let desktopDirContent = []

    try {
      this.logger.info(
        InstallationStepsEnum.REFERRAL_CODE,
        'Reading "Desktop" directory'
      )
      desktopDir = path.join(helpers.getHomePath(), 'Desktop')
      desktopDirContent = fs.readdirSync(desktopDir)
      this.logger.info(
        InstallationStepsEnum.REFERRAL_CODE,
        '"Desktop" directory read'
      )
    } catch (e) {
      this.logger.info(
        InstallationStepsEnum.REFERRAL_CODE,
        'Not allowed to read "Desktop" directory'
      )
    }
    // Make sure it's one of our file downloads and pick the first one
    const matchDir = [
      ...downloadDirContent,
      ...desktopDirContent,
      ...trashDirContent,
    ]
      .filter(
        (dir: string) =>
          dir.includes('point-') &&
          dir.match(/-\d{12}\./) &&
          (dir.includes('Linux-Debian-Ubuntu') ||
            dir.includes('Linux-RPM-Centos-Fedora') ||
            dir.includes('MacOS-installer') ||
            dir.includes('Windows-installer'))
      )
      .map((dir: string) => path.join(helpers.getHomePath(), dir))[0]
    let requiredDir, referralCode
    let isInstalledEventSent = false
    if (matchDir) {
      this.logger.info(
        InstallationStepsEnum.REFERRAL_CODE,
        'File with Referral Code exists'
      )
      // Strip the file extension
      requiredDir = matchDir
        .replace('.tar.gz', '')
        .replace('.zip', '')
        .replace('.tar', '')
        .replace(/\(\d+\)+/g, '')
        .trim()
      // Get the referral code
      referralCode = requiredDir.slice(requiredDir.length - 12)
    } else {
      referralCode = '000000000000'
    }
    if (Number.isNaN(Number(referralCode)) || Number(referralCode) < 0)
      referralCode = '000000000000'

    this.logger.info(
      InstallationStepsEnum.REFERRAL_CODE,
      'Referral Code: ',
      referralCode
    )

    await axios
      .get(
        `https://bounty.pointnetwork.io/ref_success?event=install_started&ref=${referralCode}&addr=0x0000000000000000000000000000000000000000`
      )
      .then(res => {
        this.logger.info(res.data)
        this.logger.info(
          InstallationStepsEnum.REFERRAL_CODE,
          'Sent event=install_started to https://bounty.pointnetwork.io'
        )
      })
      .catch(this.logger.error)

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
        if (fs.existsSync(dir))
          rimraf.sync(dir)
        const githubURL = helpers.getGithubURL()
        const url = `${githubURL}/pointnetwork/${repo}`
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

    await axios
      .get(
        `https://bounty.pointnetwork.io/ref_success?event=install&ref=${referralCode}&addr=0x0000000000000000000000000000000000000000`
      )
      .then(res => {
        isInstalledEventSent = true
        this.logger.info(res.data)
        this.logger.info(
          InstallationStepsEnum.REFERRAL_CODE,
          'Sent referralCode to https://bounty.pointnetwork.io'
        )
      })
      .catch(this.logger.error)

    // Save that referral code in ~/.point/infoReferral.json
    this.logger.info(
      InstallationStepsEnum.REFERRAL_CODE,
      'Saving referralCode to "infoReferral.json"'
    )
    fs.writeFileSync(
      path.join(helpers.getPointPath(), 'infoReferral.json'),
      JSON.stringify({
        referralCode,
        isInstalledEventSent,
      })
    )
    this.logger.info(
      InstallationStepsEnum.REFERRAL_CODE,
      'Saved referralCode to "infoReferral.json"'
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
