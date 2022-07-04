import { BrowserWindow } from 'electron'
import fs from 'fs-extra'
import moment from 'moment'
import path from 'node:path'
import helpers from '../../shared/helpers'
import Logger from '../../shared/logger'
import utils from '../../shared/utils'
// Types
import { PointSDKChannelsEnum } from '../@types/ipc_channels'
import { UpdateLog } from '../@types/generic'
import { ErrorsEnum } from './../@types/errors'

/**
 * WHAT THIS MODULE DOES
 * 1. Downloads and installs the Point SDK
 */
class PointSDK {
  logger: Logger
  window: BrowserWindow
  pointDir: string = helpers.getPointPath()

  constructor({ window }: { window: BrowserWindow }) {
    this.window = window
    this.logger = new Logger({ window, module: 'point_sdk' })
  }

  /**
   * Returns the latest available version for Point Node
   */
  async getLatestVersion(): Promise<string> {
    return await helpers.getLatestReleaseFromGithub('pointsdk')
  }

  /**
   * Returns the download URL for the version provided and the file name provided
   */
  getDownloadURL(filename: string, version: string): string {
    return `${helpers.getGithubURL()}/pointnetwork/pointsdk/releases/download/${version}/${filename}`
  }

  /**
   * Downloads and instals the Point SDK
   */
  downloadAndInstall(): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        const latestVersion = await this.getLatestVersion()
        // Donwload the manifest first
        const manifestDownloadUrl = this.getDownloadURL(
          'manifest.json',
          latestVersion
        )
        const manifestDownloadDest = path.join(this.pointDir, 'manifest.json')
        this.logger.info('Downloading Manifest file from', manifestDownloadUrl)

        const manifestDownloadStream =
          fs.createWriteStream(manifestDownloadDest)

        await utils.download({
          channel: PointSDKChannelsEnum.download,
          logger: this.logger,
          downloadUrl: manifestDownloadUrl,
          downloadStream: manifestDownloadStream,
        })

        // Download the extension
        manifestDownloadStream.on('close', async () => {
          const filename = `point_network-${latestVersion.replace(
            'v',
            ''
          )}-an+fx.xpi`
          const manifest = fs.readFileSync(manifestDownloadDest, 'utf8')
          const extensionId =
            JSON.parse(manifest).browser_specific_settings.gecko.id
          const extensionsPath =
            helpers.getLiveExtensionsDirectoryPathResources()

          const downloadUrl = this.getDownloadURL(filename, latestVersion)
          const downloadPath = path.join(extensionsPath, `${extensionId}.xpi`)
          this.logger.info('Downloading SDK from', downloadUrl)

          const downloadStream = fs.createWriteStream(downloadPath)

          helpers.setIsFirefoxInit(false)

          await utils.download({
            channel: PointSDKChannelsEnum.download,
            logger: this.logger,
            downloadUrl,
            downloadStream,
          })

          downloadStream.on('close', () => {
            this.logger.info('Saving "infoSDK.json"')
            fs.writeFileSync(
              path.join(this.pointDir, 'infoSDK.json'),
              JSON.stringify({
                installedReleaseVersion: latestVersion,
                lastCheck: moment().unix(),
              }),
              'utf8'
            )
            this.logger.info('Saved "infoSDK.json"')

            resolve()
          })
        })
      } catch (error) {
        this.logger.error(ErrorsEnum.POINTSDK_ERROR, reject)
        reject(error)
      }
    })
  }

  /**
   * Checks for Point Node updates
   */
  async checkForUpdates() {
    try {
      this.logger.info('Checking for updates')
      this.logger.sendToChannel({
        channel: PointSDKChannelsEnum.check_for_updates,
        log: JSON.stringify({
          isChecking: true,
          isAvailable: false,
          log: 'Checking for updates',
        } as UpdateLog),
      })
      const installInfo = helpers.getInstalledVersionInfo('sdk')
      const latestVersion = await this.getLatestVersion()

      if (
        !installInfo.lastCheck ||
        (moment().diff(moment.unix(installInfo.lastCheck), 'hours') >= 1 &&
          installInfo.installedReleaseVersion !== latestVersion)
      ) {
        this.logger.info('Update available')
        this.logger.sendToChannel({
          channel: PointSDKChannelsEnum.check_for_updates,
          log: JSON.stringify({
            isChecking: false,
            isAvailable: true,
            log: 'Update available. Proceeding to download the update',
          } as UpdateLog),
        })
        this.downloadAndInstall()
      } else {
        this.logger.info('Already upto date')
        this.logger.sendToChannel({
          channel: PointSDKChannelsEnum.check_for_updates,
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
}

export default PointSDK
