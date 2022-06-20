import { BrowserWindow } from 'electron'
import axios from 'axios'
import fs, { PathLike } from 'fs-extra'
import path from 'node:path'
import find from 'find-process'
import { spawn } from 'node:child_process'
import { https } from 'follow-redirects'
import moment from 'moment'
import rimraf from 'rimraf'
import utils from '../../shared/utils'
import Logger from '../../shared/logger'
import helpers from '../../shared/helpers'
// Types
import { NodeChannelsEnum } from './../@types/ipc_channels'
import {
  Process,
  GenericProgressLog,
  IdentityLog,
  LaunchProcessLog,
  UpdateLog,
} from '../@types/generic'

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

        const downloadStream = fs.createWriteStream(downloadDest)

        // 2. Start downloading and send logs to window
        this.logger.sendToChannel({
          channel: NodeChannelsEnum.download,
          log: JSON.stringify({
            started: true,
            log: 'Starting to download Point Node',
            progress: 0,
            done: false,
          } as GenericProgressLog),
        })
        await utils.download({
          downloadUrl,
          downloadStream,
          onProgress: progress => {
            this.logger.sendToChannel({
              channel: NodeChannelsEnum.download,
              log: JSON.stringify({
                started: true,
                log: 'Downloading Point Node',
                progress,
                done: false,
              } as GenericProgressLog),
            })
          },
        })
        this.logger.sendToChannel({
          channel: NodeChannelsEnum.download,
          log: JSON.stringify({
            started: false,
            log: 'Point Node downloaded',
            progress: 100,
            done: true,
          } as GenericProgressLog),
        })

        downloadStream.on('close', async () => {
          try {
            // 3. Unpack the downloaded file and send logs to window
            this.logger.sendToChannel({
              channel: NodeChannelsEnum.unpack,
              log: JSON.stringify({
                started: true,
                log: 'Unpacking Point Node',
                done: false,
                progress: 0,
              } as GenericProgressLog),
            })
            await decompress(downloadDest, this.pointDir, {
              plugins: [decompressTargz()],
            })
            this.logger.sendToChannel({
              channel: NodeChannelsEnum.unpack,
              log: JSON.stringify({
                started: false,
                log: 'Unpacked Point Node',
                done: true,
                progress: 100,
              } as GenericProgressLog),
            })

            // 4. Delete the downloaded file
            fs.unlinkSync(downloadDest)

            // 5. Save infoNode.json file
            fs.writeFile(
              path.join(this.pointDir, 'infoNode.json'),
              JSON.stringify({
                installedReleaseVersion: latestVersion,
                lastCheck: moment().unix(),
              }),
              'utf8'
            )

            resolve()
          } catch (error: any) {
            throw new Error(error)
          }
        })
      } catch (error) {
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
    if (!fs.existsSync(this._getBinFile())) await this.downloadAndInstall()
    if ((await this._getRunningProcess()).length) return

    const file = this._getBinFile()
    let cmd = `NODE_ENV=production "${file}"`
    if (global.platform.win32) cmd = `set NODE_ENV=production&&"${file}"`

    this.logger.info(`Launching Point Node`)
    const nodeProcess = spawn(cmd)
    nodeProcess.stdout.on('data', data => {
      this.logger.info(`Launched Point Node. STDOUT: ${data}`)
    })
    nodeProcess.stderr.on('data', data => {
      this.logger.error(`Falied to launch Point Node. STDERR: ${data}`)
    })
    nodeProcess.on('close', code => {
      this.logger.info(`Point Node exitted. CODE: ${code}`)
    })
  }

  /**
   * Pings the Point Node and checks if it is ready to receive requests
   */
  async ping() {
    try {
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
    } catch (error) {
      this.logger.sendToChannel({
        channel: NodeChannelsEnum.running_status,
        log: JSON.stringify({
          isRunning: false,
          log: 'Point Node is not running',
        } as LaunchProcessLog),
      })
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
      for (const p of process) {
        try {
          await utils.kill({ processId: p.pid, onMessage: this.logger.info })
        } catch (err) {
          this.logger.error(err)
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
  }

  /**
   * Checks for Point Node updates
   */
  async checkForUpdates() {
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

    if (
      isBinMissing ||
      !installInfo.installedReleaseVersion ||
      moment().diff(moment.unix(installInfo.lastCheck), 'hours') >= 1
    ) {
      const latestVersion = await this.getLatestVersion()

      if (
        installInfo.installedReleaseVersion !== latestVersion ||
        isBinMissing
      ) {
        this.logger.sendToChannel({
          channel: NodeChannelsEnum.check_for_updates,
          log: JSON.stringify({
            isChecking: false,
            isAvailable: true,
            log: 'Update available. Proceeding to download the update',
          } as UpdateLog),
        })
      }
    } else {
      this.logger.sendToChannel({
        channel: NodeChannelsEnum.check_for_updates,
        log: JSON.stringify({
          isChecking: false,
          isAvailable: false,
          log: 'Already upto date',
        } as UpdateLog),
      })
    }
  }

  /**
   * Returns the identity currently active on Point Node
   */
  async getIdentity() {
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
      this.logger.sendToChannel({
        channel: NodeChannelsEnum.get_identity,
        log: JSON.stringify({
          isFetching: false,
          address,
          identity: res.data.data.identity,
          log: 'Identity fetched',
        } as IdentityLog),
      })
    } catch (e) {
      this.logger.error(e)
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
