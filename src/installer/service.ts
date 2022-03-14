import { BrowserWindow } from 'electron'
import helpers from '../../shared/helpers'
import Logger from '../../shared/logger'
import Firefox from '../firefox'
import Node from '../node'
import { InstallationStepsEnum } from '../@types/installation'

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
  private static installationJsonFilePath: string = path.join(
    helpers.getPointPath(),
    'installer.json'
  )

  constructor(window: BrowserWindow) {
    this.logger = new Logger({ window, channel: 'installer' })
    this.window = window
    this.firefox = new Firefox(window)
    this.node = new Node(window)
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
      InstallationStepsEnum.DIRECTORIES,
      'Creating directories...'
    )
    DIRECTORIES.forEach(dir => {
      try {
        this.logger.info(InstallationStepsEnum.DIRECTORIES, 'Creating:', dir)
        fs.mkdirSync(dir, { recursive: true })
        this.logger.info(InstallationStepsEnum.DIRECTORIES, 'Created:', dir)
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
      InstallationStepsEnum.DIRECTORIES,
      'Created required directories'
    )
    // Clone the repos
    this.logger.info(InstallationStepsEnum.CODE, 'Cloning the repositores')
    await Promise.all(
      REPOSITORIES.map(async repo => {
        const dir = path.join(POINT_SRC_DIR, repo)
        const url = `https://github.com/pointnetwork/${repo}`

        this.logger.info(InstallationStepsEnum.CODE, 'Cloning', url)
        await git.clone({
          fs,
          http,
          dir,
          url,
          onMessage: (...args: string[]) => {
            this.logger.info(InstallationStepsEnum.CODE, ...args)
          },
        })
        this.logger.info(InstallationStepsEnum.CODE, 'Cloned', url)
        this.logger.info(InstallationStepsEnum.CODE, 'Copying liveprofile')
        helpers.copyFolderRecursiveSync(dir, POINT_LIVE_DIR)
      })
    )

    this.logger.info(InstallationStepsEnum.CODE, 'Cloned repositories')

    await this.firefox.download()
    await this.node.download()

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
