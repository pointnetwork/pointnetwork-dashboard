import { BrowserWindow } from 'electron'
import axios from 'axios'
import fs, { PathLike } from 'fs-extra'
import path from 'node:path'
import find from 'find-process'
import { exec } from 'node:child_process'
import { https } from 'follow-redirects'
import moment from 'moment'
import rimraf from 'rimraf'
import utils from '../../shared/utils'
import Logger from '../../shared/logger'
import helpers from '../../shared/helpers'
// Types
import { NodeChannelsEnum } from '../@types/ipc_channels'
import {
  Process,
  GenericProgressLog,
  IdentityLog,
  LaunchProcessLog,
  UpdateLog,
} from '../@types/generic'
import { ErrorsEnum } from '../@types/errors'

const decompress = require('decompress')
const decompressTargz = require('decompress-targz')

// TODO: Add JSDoc comments
/**
 * WHAT THIS MODULE DOES
 * 1. Downloads the Point Node
 * 2. Checks for updates whether new Point Node release is available
 * 3. Launches the Point Node
 * 4. Kills the Point Node
 * 5. Returns the running identity
 * 6. Returns the status if Point Node is running or not
 * 7. Returns the status if Point Node exists or not
 */
class Node {
  logger: Logger
  window: BrowserWindow
  pointDir: string = helpers.getPointPath()

  constructor({ window }: { window: BrowserWindow }) {
    this.window = window
    this.logger = new Logger({ window, module: 'point_node' })
  }

  /**
   * Returns the latest available version for Point Node
   */
  async getLatestVersion(): Promise<string> {
    this.logger.info('Getting latest version')
    return await helpers.getLatestReleaseFromGithub('pointnetwork')
  }

  /**
   * Returns the download URL for the version provided and the file name provided
   */
  getDownloadURL(filename: string, version: string): string {
    return `${helpers.getGithubURL()}/pointnetwork/pointnetwork/releases/download/${version}/${filename}`
  }

  /**
   * Downloads the Point Node binary from GitHub, extracts it to the .point directory, deletes the downloaded file, and saves the info to infoNode.json file
   */
  downloadAndInstall(): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        // Delete any residual files and stop any residual processes
        this.logger.info('Removing previous installations')

        if (fs.existsSync(path.join(this.pointDir, 'contracts')))
          rimraf.sync(path.join(this.pointDir, 'contracts'))
        if (fs.existsSync(path.join(this.pointDir, 'bin')))
          rimraf.sync(path.join(this.pointDir, 'bin'))

        // 1. Set the parameters for download
        const latestVersion = await this.getLatestVersion()
        let fileName = `point-linux-${latestVersion}.tar.gz`
        if (global.platform.win32)
          fileName = `point-win-${latestVersion}.tar.gz`
        if (global.platform.darwin)
          fileName = `point-macos-${latestVersion}.tar.gz`

        const downloadUrl = this.getDownloadURL(fileName, latestVersion)
        const downloadDest = path.join(this.pointDir, fileName)
        this.logger.info('Downloading from', downloadUrl)

        const downloadStream = fs.createWriteStream(downloadDest)

        // 2. Start downloading and send logs to window
        await utils.download({
          channel: NodeChannelsEnum.download,
          logger: this.logger,
          downloadUrl,
          downloadStream,
        })

        downloadStream.on('close', async () => {
          try {
            this.logger.info('Unpacking')
            // 3. Unpack the downloaded file and send logs to window
            this.logger.sendToChannel({
              channel: NodeChannelsEnum.unpack,
              log: JSON.stringify({
                started: true,
                log: 'Unpacking Point Node',
                done: false,
                progress: 0,
                error: false,
              } as GenericProgressLog),
            })
            try {
              await decompress(downloadDest, this.pointDir, {
                plugins: [decompressTargz()],
              })
            } catch (error) {
              this.logger.sendToChannel({
                channel: NodeChannelsEnum.unpack,
                log: JSON.stringify({
                  log: 'Error unpacking the Point Node',
                  error: true,
                } as GenericProgressLog),
              })
              this.logger.error(ErrorsEnum.UNPACK_ERROR, error)
              throw error
            }
            this.logger.sendToChannel({
              channel: NodeChannelsEnum.unpack,
              log: JSON.stringify({
                started: false,
                log: 'Unpacked Point Node',
                done: true,
                progress: 100,
              } as GenericProgressLog),
            })
            this.logger.info('Unpacked')
            // 4. Delete the downloaded file
            this.logger.info('Removing downloaded file')
            fs.unlinkSync(downloadDest)
            this.logger.info('Removed downloaded file')

            // 5. Save infoNode.json file
            this.logger.info('Saving "infoNode.json"')
            fs.writeFile(
              path.join(this.pointDir, 'infoNode.json'),
              JSON.stringify({
                installedReleaseVersion: latestVersion,
                lastCheck: moment().unix(),
              }),
              'utf8'
            )
            this.logger.info('Saved "infoNode.json"')

            resolve()
          } catch (error) {
            this.logger.error(ErrorsEnum.NODE_ERROR, error)
            reject(error)
          }
        })
      } catch (error) {
        this.logger.error(ErrorsEnum.NODE_ERROR, error)
        reject(error)
      }
    })
  }

  /**
   * Checks
   * 1. If Point Node exists or not, if it doesn't then downloads it
   * 2. Checks if there are any running instances of Point Node, if yes then returns early
   * 3. Launches the Point Node
   */
  async launch() {
    try {
      if (!fs.existsSync(this._getBinFile())) await this.downloadAndInstall()
      if ((await this._getRunningProcess()).length) return

      const file = this._getBinFile()
      let cmd = `NODE_ENV=production "${file}"`
      if (global.platform.win32) cmd = `set NODE_ENV=production&&"${file}"`

      this.logger.info('Launching')
      return exec(cmd, (error, stdout, stderr) => {
        if (stdout) this.logger.info('Ran successfully')
        if (error) {
          this.logger.error(ErrorsEnum.LAUNCH_ERROR, error)
        }
        if (stderr) {
          this.logger.error(ErrorsEnum.LAUNCH_ERROR, stderr)
        }
      })
    } catch (error) {
      this.logger.error(ErrorsEnum.LAUNCH_ERROR, error)
      throw error
    }
  }

  /**
   * Pings the Point Node and checks if it is ready to receive requests
   */
  async ping() {
    try {
      this.logger.info('Pinging')
      await axios.get('https://point/v1/api/status/meta', {
        timeout: 3000,
        proxy: {
          host: 'localhost',
          port: 8666,
          protocol: 'https',
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      })
      this.logger.sendToChannel({
        channel: NodeChannelsEnum.running_status,
        log: JSON.stringify({
          isRunning: true,
          log: 'Point Node is running',
        } as LaunchProcessLog),
      })
      this.logger.info('Pinged')
    } catch (error) {
      this.logger.sendToChannel({
        channel: NodeChannelsEnum.running_status,
        log: JSON.stringify({
          isRunning: false,
          log: 'Point Node is not running',
        } as LaunchProcessLog),
      })
      this.logger.error(ErrorsEnum.NODE_ERROR, 'Unable to Ping')
    }
  }

  /**
   * Stops the running instances of Point Node
   */
  async stop() {
    this.logger.sendToChannel({
      channel: NodeChannelsEnum.stop,
      log: JSON.stringify({
        started: true,
        log: 'Finding running processes for Point Node',
        done: false,
      } as GenericProgressLog),
    })
    const process = await this._getRunningProcess()
    if (process.length > 0) {
      this.logger.info('Stopping')
      for (const p of process) {
        try {
          await utils.kill({ processId: p.pid, onMessage: this.logger.info })
        } catch (err) {
          this.logger.error(ErrorsEnum.STOP_ERROR, err)
          throw err
        }
      }
    }
    this.logger.sendToChannel({
      channel: NodeChannelsEnum.stop,
      log: JSON.stringify({
        started: true,
        log: 'Killed running processes for Point Node',
        done: false,
      } as GenericProgressLog),
    })
    this.logger.info('Stopped')
  }

  /**
   * Checks for Point Node updates
   */
  async checkForUpdates() {
    try {
      this.logger.info('Checking for updates')
      this.logger.sendToChannel({
        channel: NodeChannelsEnum.check_for_updates,
        log: JSON.stringify({
          isChecking: true,
          isAvailable: false,
          log: 'Checking for updates',
        } as UpdateLog),
      })
      const installInfo = helpers.getInstalledVersionInfo('node')
      const isBinMissing = !fs.existsSync(this._getBinFile())
      const latestVersion = await this.getLatestVersion()

      if (
        isBinMissing ||
        !installInfo.lastCheck ||
        (moment().diff(moment.unix(installInfo.lastCheck), 'hours') >= 1 &&
          installInfo.installedReleaseVersion !== latestVersion)
      ) {
        this.logger.info('Update available')
        this.logger.sendToChannel({
          channel: NodeChannelsEnum.check_for_updates,
          log: JSON.stringify({
            isChecking: false,
            isAvailable: true,
            log: 'Update available. Proceeding to download the update',
          } as UpdateLog),
        })
        await this.stop()
        this.downloadAndInstall()
      } else {
        this.logger.info('Already upto date')
        this.logger.sendToChannel({
          channel: NodeChannelsEnum.check_for_updates,
          log: JSON.stringify({
            isChecking: false,
            isAvailable: false,
            log: 'Already upto date',
          } as UpdateLog),
        })
      }
    } catch (error) {
      this.logger.error(ErrorsEnum.UPDATE_ERROR, error)
      throw error
    }
  }

  /**
   * Returns the identity currently active on Point Node
   */
  async getIdentityInfo(): Promise<{ address: string; identity: string }> {
    this.logger.info('Getting identity')
    this.logger.sendToChannel({
      channel: NodeChannelsEnum.get_identity,
      log: JSON.stringify({
        isFetching: true,
        address: '',
        identity: '',
        log: 'Getting identity',
      } as IdentityLog),
    })
    try {
      let res = await axios.get('http://localhost:2468/v1/api/wallet/address')
      const address = res.data.data.address

      res = await axios.get(
        `http://localhost:2468/v1/api/identity/ownerToIdentity/${address}`
      )
      const identity = res.data.data.identity
      this.logger.info('Fetched identity')
      this.logger.sendToChannel({
        channel: NodeChannelsEnum.get_identity,
        log: JSON.stringify({
          isFetching: false,
          address,
          identity,
          log: 'Identity fetched',
        } as IdentityLog),
      })
      return { address, identity }
    } catch (e) {
      this.logger.error(ErrorsEnum.NODE_ERROR, e)
      throw e
    }
  }

  /**
   * Returns the running instances of Point Node
   */
  async _getRunningProcess(): Promise<Process[]> {
    return await (
      await find('name', 'point', true)
    )
      // @ts-ignore
      .filter(p => p.bin.match(/bin.+?point(.exe)?$/))
  }

  /**
   * Returns the path where the downloaded Point Node executable exists
   */
  _getBinFile(): PathLike {
    const binPath = helpers.getBinPath()
    if (global.platform.win32) return path.join(binPath, 'win', 'point.exe')
    if (global.platform.darwin) return path.join(binPath, 'macos', 'point')
    return path.join(binPath, 'linux', 'point')
  }
}

export default Node
