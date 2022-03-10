import { BrowserWindow } from 'electron'
import helpers from '../../shared/helpers'
import Logger from '../../shared/logger'
import Firefox from '../firefox'
import Node from '../node'

const path = require('path')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const fs = require('fs')
const rimraf = require("rimraf");

const POINT_SRC_DIR = helpers.getPointSrcPath()
const POINT_DASHBOARD_DIR = helpers.getDashboardPath()
const POINT_LIVE_DIR = helpers.getLiveDirectoryPath()
const POINT_BIN_NODE = helpers.getBinPath()

const DIRECTORIES = [
  POINT_DASHBOARD_DIR,
  helpers.getPointSoftwarePath(),
  POINT_LIVE_DIR,
  POINT_BIN_NODE,
]

const REPOSITORIES = ['pointnetwork-dashboard']

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

  static async checkNodeVersion() {

      const pointPath = helpers.getPointPath()
      if(!fs.existsSync(path.join(pointPath, 'src'))){
        return
      }
      const installedVersion = helpers.getInstalledVersion()
      
      console.log(installedVersion.nodeVersionInstalled )
      if (installedVersion.nodeVersionInstalled !== '11' && installedVersion.nodeVersionInstalled ) {
        console.log('Node Update need it')
        if (fs.existsSync(path.join(pointPath, 'contracts'))) rimraf.sync(path.join(pointPath, 'contracts'));
        if (fs.existsSync(path.join(pointPath, 'keystore'))) rimraf.sync(path.join(pointPath, 'keystore'));
        if (fs.existsSync(path.join(pointPath, 'bin'))) rimraf.sync(path.join(pointPath, 'bin'));
      }
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

  createWindow = async () => { }

  start = async () => {
<<<<<<< HEAD
    this.logger.log('Starting')

    if (await Installer.isInstalled()) {
=======
    if (Installer.isInstalled()) {
>>>>>>> 1455d70b98f45f053aebfa87ebbaed8211786050
      await this.upgrade()
    } else {
      await this.install()
    }
  }

  checkUpdateOrInstall = () => {
    const installedVersion = helpers.getInstalledVersion()

    if (installedVersion.nodeVersionInstalled !== '11'  && installedVersion.nodeVersionInstalled) {
      this.window.webContents.send(`installer:update`, true)
    }
  }

  install = async () => {
    this.logger.log('Starting installation')

    // Create the appropriate directories
    this.logger.log('Creating directories...')
    DIRECTORIES.forEach(dir => {
      try {
        this.logger.log('Creating:', dir)
        fs.mkdirSync(dir, { recursive: true })
        this.logger.log('Created:', dir)
      } catch (error) {
        this.logger.error(error)
      }
    })

    // Create a json file and set `isInstalled` flag to false
    fs.writeFileSync(
      Installer.installationJsonFilePath,
      JSON.stringify({ isInstalled: false })
    )

    this.logger.log('Created required directories')
    // Clone the repos
    this.logger.log('Cloning the repositores')
    await Promise.all(
      REPOSITORIES.map(async repo => {
        const dir = path.join(POINT_SRC_DIR, repo)
        const url = `https://github.com/pointnetwork/${repo}`

        this.logger.log('Cloning', url)
        await git.clone({
          fs,
          http,
          dir,
          onMessage: this.logger.log,
          url,
        })
        this.logger.log('Cloned', url)
        if (dir.includes('dashboard')) {
          this.logger.log('Copying liveprofile')
          helpers.copyFolderRecursiveSync(
            path.join(POINT_DASHBOARD_DIR, 'liveprofile'),
            POINT_LIVE_DIR
          )
        }
      })
    )

    this.logger.log('Cloned repositories')

    await this.firefox.download()
    await this.node.download()

    // Set the `isInstalled` flag to true
    fs.writeFileSync(
      Installer.installationJsonFilePath,
      JSON.stringify({ isInstalled: true })
    )
    this.logger.log('Installation complete')
  }

  close() {
    this.window.close()
  }

  upgrade = async () => {
    this.logger.log('Already installed')

    // Pull the latest code
    this.logger.log('Pulling the repositories')
    await Promise.all(
      REPOSITORIES.map(async repo => {
        this.logger.log('Pulling', repo)

        const dir = path.join(POINT_SRC_DIR, repo)
        await git.pull({
          fs,
          http,
          dir,
          author: { name: 'PointNetwork', email: 'pn@pointnetwork.io' },
        })
      })
    )

    this.logger.log('Pull Complete')
  }
}

export default Installer


