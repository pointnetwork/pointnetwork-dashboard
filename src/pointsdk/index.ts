import { BrowserWindow } from 'electron'
import fs from 'fs-extra'
import moment from 'moment'
import path from 'node:path'
import helpers from '../../shared/helpers'
import Logger from '../../shared/logger'
import utils from '../../shared/utils'
import { PointSDKChannelsEnum } from '../@types/ipc_channels'
import { UpdateLog } from '../@types/generic'

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
        this.logger.info('Downloading Manifest file')
        const manifestDownloadUrl = this.getDownloadURL(
          'manifest.json',
          latestVersion
        )
        const manifestDownloadDest = path.join(this.pointDir, 'manifest.json')
        const manifestDownloadStream =
          fs.createWriteStream(manifestDownloadDest)

        await utils.download({
          downloadUrl: manifestDownloadUrl,
          downloadStream: manifestDownloadStream,
        })
        this.logger.info('Downloaded Manifest file')

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
          const downloadStream = fs.createWriteStream(downloadPath)

          helpers.setIsFirefoxInit(false)

          await utils.download({
            asset: 'SDK Extension',
            channel: PointSDKChannelsEnum.download,
            logger: this.logger,
            downloadUrl,
            downloadStream,
          })

          downloadStream.on('close', () => {
            fs.writeFileSync(
              path.join(this.pointDir, 'infoSDK.json'),
              JSON.stringify({
                installedReleaseVersion: latestVersion,
                lastCheck: moment().unix(),
              }),
              'utf8'
            )
            resolve()
          })
        })
      } catch (error) {
        this.logger.error(error)
        reject(error)
      }
    })
  }

  /**
   * Checks for Point Node updates
   */
  async checkForUpdates() {
    this.logger.sendToChannel({
      channel: PointSDKChannelsEnum.check_for_updates,
      log: JSON.stringify({
        isChecking: true,
        isAvailable: false,
        log: 'Checking for updates',
      } as UpdateLog),
    })
    const installInfo = helpers.getInstalledVersionInfo('sdk')

    if (
      !installInfo.installedReleaseVersion ||
      moment().diff(moment.unix(installInfo.lastCheck), 'hours') >= 1
    ) {
      const latestVersion = await this.getLatestVersion()

      if (installInfo.installedReleaseVersion !== latestVersion) {
        this.logger.sendToChannel({
          channel: PointSDKChannelsEnum.check_for_updates,
          log: JSON.stringify({
            isChecking: false,
            isAvailable: true,
            log: 'Update available. Proceeding to download the update',
          } as UpdateLog),
        })
      }
    } else {
      this.logger.sendToChannel({
        channel: PointSDKChannelsEnum.check_for_updates,
        log: JSON.stringify({
          isChecking: false,
          isAvailable: false,
          log: 'Already upto date',
        } as UpdateLog),
      })
    }
  }
}

export default PointSDK
