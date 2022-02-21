import { BrowserWindow } from 'electron'
import helpers from '../../shared/helpers'
import Logger from '../../shared/logger'
const path = require('path')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const fs = require('fs')

const POINT_SRC_DIR = helpers.getPointSrcPath()

const DIRECTORIES = [
  helpers.getPNPath(),
  helpers.getDashboardPath(),
  helpers.getPointSoftwarePath(),
  helpers.getLiveDirectoryPath(),
]

const REPOSITORIES = ['pointnetwork', 'pointnetwork-dashboard']

class Installer {
  private logger

  constructor(window: BrowserWindow) {
    this.logger = new Logger({ window, channel: 'installer' })
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
          onProgress: (progress: { phase: any; loaded: any; total: any }) => {
            let log = `${progress.phase}: ${progress.loaded}`
            if (progress.total) log = `${log}/${progress.total}`
            this.logger.log(log)
          },
          url,
        })
        this.logger.log('Cloned', url)
      })
    )

    // Finish
    this.logger.log('Cloned the repositores')
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
          onProgress: (progress: { phase: any; loaded: any; total: any }) => {
            let log = `${progress.phase}: ${progress.loaded}`
            if (progress.total) log = `${log}/${progress.total}`
            this.logger.log(log)
          },
          author: { name: 'PointNetwork', email: 'pn@pointnetwork.io' },
        })
      })
    )

    this.logger.log('Pull Complete')
  }
}

export default Installer
