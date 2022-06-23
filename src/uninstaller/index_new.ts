import { BrowserWindow } from 'electron'
import fs from 'fs-extra'
import path from 'node:path'
import rimraf from 'rimraf'
import Logger from '../../shared/logger'
import helpers from '../../shared/helpers'
import utils from '../../shared/utils'
// Types
import { ErrorsEnum } from './../@types/errors'
import { UninstallerChannelsEnum } from './../@types/ipc_channels'
import { GenericProgressLog } from '../@types/generic'

const decompress = require('decompress')
const decompressTargz = require('decompress-targz')

// TODO: Add JSDoc comments
/**
 * WHAT THIS MODULE DOES
 * 1. Downloads the Point Uninstaller
 * 2. Checks for updates whether new Point Uninstaller release is available
 * 3. Launches the Point Uninstaller
 */
class Uninstaller {
  logger: Logger
  window: BrowserWindow
  pointDir: string = helpers.getPointPath()

  constructor({ window }: { window: BrowserWindow }) {
    this.window = window
    this.logger = new Logger({ window, module: 'uninstaller' })
  }

  /**
   * Returns the latest available version for Point Node
   */
  async getLatestVersion(): Promise<string> {
    return await helpers.getLatestReleaseFromGithub('pointnetwork-uninstaller')
  }

  /**
   * Returns the download URL for the version provided and the file name provided
   */
  getDownloadURL(filename: string, version: string): string {
    return `${helpers.getGithubURL()}/pointnetwork/pointnetwork-uninstaller/releases/download/${version}/${filename}`
  }

  /**
   * Downloads the Point Uninstaller binary from GitHub, extracts it to the .temp directory, deletes the downloaded file
   */
  downloadAndInstall(): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        // 1. Set the parameters for download
        const latestVersion = await this.getLatestVersion()
        let filename = `point-uninstaller-${latestVersion}-Linux-Debian-Ubuntu.tar.gz`
        if (global.platform.win32)
          filename = `point-uninstaller-${latestVersion}-Windows-installer.zip`
        if (global.platform.darwin)
          filename = `point-uninstaller-${latestVersion}-MacOS-portable.tar.gz`

        const downloadUrl = this.getDownloadURL(filename, latestVersion)
        const downloadDest = path.join(this.pointDir, filename)

        const downloadStream = fs.createWriteStream(downloadDest)

        // 2. Start downloading and send logs to window
        await utils.download({
          channel: UninstallerChannelsEnum.download,
          logger: this.logger,
          downloadUrl,
          downloadStream,
        })

        // 3. Unpack the downloaded file and send logs to window
        downloadStream.on('close', async () => {
          try {
            const temp = helpers.getPointPathTemp()
            if (fs.existsSync(temp)) rimraf.sync(temp)
            fs.mkdirpSync(temp)

            try {
              this.logger.sendToChannel({
                channel: UninstallerChannelsEnum.unpack,
                log: JSON.stringify({
                  started: true,
                  log: 'Unpacking Point Uninstaller',
                  done: false,
                  progress: 0,
                  error: false,
                } as GenericProgressLog),
              })
              if (global.platform.win32) {
                await utils.extractZip({
                  src: downloadDest,
                  dest: temp,
                  onProgress: (progress: number) => {
                    this.logger.sendToChannel({
                      channel: UninstallerChannelsEnum.unpack,
                      log: JSON.stringify({
                        started: true,
                        log: 'Unpacking Point Uninstaller',
                        done: false,
                        progress,
                      } as GenericProgressLog),
                    })
                  },
                })
              }

              if (global.platform.darwin) {
                await decompress(downloadDest, this.pointDir, {
                  plugins: [decompressTargz()],
                })
              }

              if (global.platform.linux) {
                // TODO: Add code for linux
              }

              this.logger.sendToChannel({
                channel: UninstallerChannelsEnum.unpack,
                log: JSON.stringify({
                  started: false,
                  log: 'Unpacked Point Uninstaller',
                  done: true,
                  progress: 100,
                } as GenericProgressLog),
              })
            } catch (error) {
              this.logger.sendToChannel({
                channel: UninstallerChannelsEnum.unpack,
                log: JSON.stringify({
                  error: true,
                  log: 'Error unpacking Point Uninstaller',
                } as GenericProgressLog),
              })
              utils.throwError({
                type: ErrorsEnum.UNPACK_ERROR,
                error,
              })
            }

            // 4. Delete the downloaded file
            fs.unlinkSync(downloadDest)

            resolve()
          } catch (error) {
            utils.throwError({
              type: ErrorsEnum.UNINSTALLER_ERROR,
              error,
              reject,
            })
          }
        })
      } catch (error) {
        utils.throwError({ type: ErrorsEnum.UNINSTALLER_ERROR, error, reject })
      }
    })
  }
}

export default Uninstaller
