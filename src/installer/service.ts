import { BrowserWindow } from 'electron'
import helpers from '../../shared/helpers'
import Logger from '../../shared/logger'
import Firefox from '../firefox/index_new'
import PointSDK from '../pointsdk'
import Node from '../node/index_new'
import Uninstaller from '../uninstaller/index_new'
import { getProgressFromGithubMsg } from './helpers'
import rimraf from 'rimraf'
import Bounty from '../bounty'
// Types
import { GenericProgressLog } from './../@types/generic'
import { InstallerChannelsEnum } from '../@types/ipc_channels'

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
  private bounty: Bounty
  private uninstaller: Uninstaller
  private static installationJsonFilePath: string = path.join(
    helpers.getPointPath(),
    'installer.json'
  )

  constructor(window: BrowserWindow) {
    this.logger = new Logger({
      window,
      channel: 'installer',
      module: 'installer',
    })
    this.window = window
    this.firefox = new Firefox({ window })
    this.node = new Node({ window })
    this.uninstaller = new Uninstaller({ window })
    this.bounty = new Bounty({ window })
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

  start = async () => {
    if (!Installer.isInstalled()) {
      await this.install()
    }
  }

  install = async () => {
    this.logger.info('Starting installation')

    // Create a json file and set `isInstalled` flag to false
    fs.writeFileSync(
      Installer.installationJsonFilePath,
      JSON.stringify({ isInstalled: false })
    )

    await this.bounty.sendInstallStarted()

    // Create the appropriate directories
    this._createDirs()

    // Clone the repos
    await this._cloneRepos()

    await this.uninstaller.downloadAndInstall()
    await this.firefox.downloadAndInstall()
    await new PointSDK({ window: this.window }).downloadAndInstall()
    await this.node.downloadAndInstall()

    await this.bounty.sendInstalled()
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

  /**
   * Created the required directories
   */
  _createDirs(): void {
    this.logger.sendToChannel({
      channel: InstallerChannelsEnum.create_dirs,
      log: JSON.stringify({
        started: true,
        done: false,
        progress: 0,
        log: 'Creating required directories',
      } as GenericProgressLog),
    })

    DIRECTORIES.forEach(dir => {
      const total = DIRECTORIES.length
      let created = 0

      fs.mkdirSync(dir, { recursive: true })

      created++
      const progress = Math.round((created / total) * 100)

      this.logger.sendToChannel({
        channel: InstallerChannelsEnum.create_dirs,
        log: JSON.stringify({
          started: true,
          done: false,
          progress,
          log: `Created ${dir}`,
        } as GenericProgressLog),
      })
    })
    this.logger.sendToChannel({
      channel: InstallerChannelsEnum.create_dirs,
      log: JSON.stringify({
        started: false,
        done: true,
        progress: 100,
        log: `Created required directories`,
      } as GenericProgressLog),
    })
  }

  /**
   * Clones the required repositories and copies the live profile
   */
  async _cloneRepos(): Promise<void> {
    this.logger.sendToChannel({
      channel: InstallerChannelsEnum.clone_repos,
      log: JSON.stringify({
        started: true,
        done: false,
        progress: 0,
        log: 'Cloning the repositores',
      } as GenericProgressLog),
    })
    await Promise.all(
      REPOSITORIES.map(async repo => {
        const dir = path.join(POINT_SRC_DIR, repo)
        if (fs.existsSync(dir)) rimraf.sync(dir)
        const githubURL = helpers.getGithubURL()
        const url = `${githubURL}/pointnetwork/${repo}`

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

              this.logger.sendToChannel({
                channel: InstallerChannelsEnum.clone_repos,
                log: JSON.stringify({
                  started: true,
                  done: false,
                  progress,
                  log: `Cloning repo: ${url}`,
                } as GenericProgressLog),
              })
            } else {
              this.logger.info(msg)
            }
          },
        })
        this.logger.sendToChannel({
          channel: InstallerChannelsEnum.clone_repos,
          log: JSON.stringify({
            started: false,
            done: true,
            progress: 90,
            log: 'Copying live profile',
          } as GenericProgressLog),
        })
        helpers.copyFolderRecursiveSync(dir, POINT_LIVE_DIR)
      })
    )
    this.logger.sendToChannel({
      channel: InstallerChannelsEnum.clone_repos,
      log: JSON.stringify({
        started: false,
        done: true,
        progress: 100,
        log: 'Cloned required repositories',
      } as GenericProgressLog),
    })
  }
}

export default Installer
