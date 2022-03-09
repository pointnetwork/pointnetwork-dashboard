import { BrowserWindow } from 'electron'
import helpers from '../../shared/helpers'
import Logger from '../../shared/logger'

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

const REPOSITORIES = ['pointnetwork-dashboard', 'pointsdk']

class Installer {
  private logger
  private window

  constructor(window: BrowserWindow) {
    this.logger = new Logger({ window, channel: 'installer' })
    this.window = window
  }

  static async checkNodeVersion() {
    const installedVersion = helpers.getInstalledVersion()
    const pointPath = helpers.getPointPath()

    if (installedVersion.nodeVersionInstalled !== global.nodePoint.version) {
      console.log('Node Update need it')
      await rimraf(path.join(pointPath, 'contracts'), async () => {
        console.log('delete Contracts')
      });
      await rimraf(path.join(pointPath, 'keystore'), async () => {
        console.log('delete keystore')
      });
      await rimraf(path.join(pointPath, 'bin'), async () => {
        console.log('delete bin')
      });
      return true
    }
    return false
  }

  static isInstalled = async () => {
    return (
      await Promise.all(DIRECTORIES.map(dir => fs.existsSync(dir)))
    ).every(result => result)
  }

  createWindow = async () => {}

  start = async () => {
    this.logger.log('Starting')

    if (await Installer.isInstalled()) {
      await this.upgrade()
    } else {
      await this.install()
    }
    this.logger.log('Done')
  }

  checkUpdateOrInstall = () =>{
    const installedVersion = helpers.getInstalledVersion()
    
    if (installedVersion.nodeVersionInstalled !== global.nodePoint.version) {
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
          // onProgress: (progress: { phase: any; loaded: any; total: any }) => {
          //   let log = `${progress.phase}: ${progress.loaded}`
          //   if (progress.total) log = `${log}/${progress.total}`
          //   this.logger.log(log)
          // },
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
    this.logger.log('Installing Dependencies')

    // Finish
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
          // onProgress: (progress: { phase: any; loaded: any; total: any }) => {
          //   let log = `${progress.phase}: ${progress.loaded}`
          //   if (progress.total) log = `${log}/${progress.total}`
          //   this.logger.log(log)
          // },
          author: { name: 'PointNetwork', email: 'pn@pointnetwork.io' },
        })
      })
    )

    this.logger.log('Pull Complete')
  }
}

export default Installer


