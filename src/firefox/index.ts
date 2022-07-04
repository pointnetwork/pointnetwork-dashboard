import { BrowserWindow } from 'electron'
import fs from 'fs-extra'
import axios from 'axios'
import moment from 'moment'
import path from 'node:path'
import tarfs from 'tar-fs'
import url from 'url'
import progress from 'progress-stream'
import find from 'find-process'
import rimraf from 'rimraf'
import { exec } from 'child_process'
import helpers from '../../shared/helpers'
import Logger from '../../shared/logger'
import utils from '../../shared/utils'
// Types
import {
  GenericProgressLog,
  LaunchProcessLog,
  UpdateLog,
  Process,
  GithubRelease,
} from '../@types/generic'
import { FirefoxChannelsEnum } from '../@types/ipc_channels'
import { ErrorsEnum } from '../@types/errors'

const dmg = require('dmg')
const bz2 = require('unbzip2-stream')

/**
 * WHAT THIS MODULE DOES
 * 1. Downloads the Firefox Browser
 * 2. Checks for updates whether new Firefox Browser release is available
 * 3. Launches the Firefox Browser
 * 4. Kills the Firefox Browser
 */
class Firefox {
  logger: Logger
  window: BrowserWindow
  pointDir: string = helpers.getPointPath()

  constructor({ window }: { window: BrowserWindow }) {
    this.window = window
    this.logger = new Logger({ window, module: 'firefox' })
  }

  /**
   * Returns the latest available version for Firefox
   */
  async getLatestVersion(): Promise<string> {
    try {
      this.logger.info('Getting the latest version')
      const res = await axios.get(
        'https://product-details.mozilla.org/1.0/firefox_versions.json'
      )
      return res.data.LATEST_FIREFOX_VERSION
    } catch (error: any) {
      this.logger.error('Failed to get the latest version')
      throw error
    }
  }

  /**
   * Returns the download URL for the version provided and the file name provided
   */
  async getDownloadURL({
    filename,
    version,
  }: {
    filename: string
    version: string
  }): Promise<string> {
    if (global.platform.win32) {
      const owner = 'pointnetwork'
      const repo = 'phyrox-esr-portable'
      const githubAPIURL = helpers.getGithubAPIURL()
      const githubURL = helpers.getGithubURL()
      const url = `${githubAPIURL}/repos/${owner}/${repo}/releases/latest`
      const fallback = `${githubURL}/${owner}/${repo}/releases/download/91.7.1-58/point-browser-portable-win64-91.7.1-57.zip`
      const re = /point-browser-portable-win64-\d+.\d+.\d+(-\d+)?.zip/

      try {
        const { data } = await axios.get<GithubRelease>(url)
        const browserAsset = data.assets.find(a => re.test(a.name))

        if (!browserAsset) {
          return fallback
        }

        return browserAsset.browser_download_url
      } catch (err) {
        return fallback
      }
    }

    return `https://download.cdn.mozilla.net/pub/mozilla.org/firefox/releases/${version}/${helpers.getOSAndArch()}/en-US/${filename}`
  }

  /**
   * Downloads the Firefox brwoser, extracts it to the .point directory, deletes the downloaded file, and saves the info to infoFirefox.json file
   */
  downloadAndInstall(): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        // 0. Delete previous installation
        this.logger.info('Removing previous installations')
        const browserDir = path.join(this.pointDir, 'src', 'point-browser')
        rimraf.sync(browserDir)

        // 1. Set the parameters for download
        const version = await this.getLatestVersion()
        let filename = `firefox-${version}.tar.bz2`
        if (global.platform.darwin) {
          filename = `Firefox%20${version}.dmg`
        }
        if (global.platform.win32) filename = `firefox-win-${version}.zip`

        const downloadUrl = await this.getDownloadURL({ version, filename })
        const downloadDest = path.join(this.pointDir, filename)
        this.logger.info('Downloading from', downloadUrl)

        const downloadStream = fs.createWriteStream(downloadDest)

        // 2. Start downloading and send logs to window
        await utils.download({
          channel: FirefoxChannelsEnum.download,
          logger: this.logger,
          downloadUrl,
          downloadStream,
        })

        downloadStream.on('close', async () => {
          try {
            // Unack
            await this._unpack({ src: downloadDest, dest: browserDir })
            // Create configuration files
            this._createConfigFiles()
            // Delete downloaded file
            this.logger.info('Removing downloaded file')
            fs.unlinkSync(downloadDest)
            this.logger.info('Removed downloaded file')
            // Write JSON file
            this.logger.info('Saving "infoFirefox.json"')
            fs.writeFileSync(
              path.join(this.pointDir, 'infoFirefox.json'),
              JSON.stringify({
                installedReleaseVersion: version,
                lastCheck: moment().unix(),
                isInitialized: false,
              }),
              'utf8'
            )
            this.logger.info('Saved "infoFirefox.json"')

            resolve()
          } catch (error) {
            this.logger.error(ErrorsEnum.FIREFOX_ERROR, error)
            reject(error)
          }
        })
      } catch (error) {
        this.logger.error(ErrorsEnum.FIREFOX_ERROR, error)
        reject(error)
      }
    })
  }

  /**
   * Launches the Firefox brwoser if Firefox is not running already
   */
  async launch() {
    try {
      if (!fs.existsSync(this._getBinFile())) await this.downloadAndInstall()
      if ((await this._getRunningProcess()).length) {
        this.logger.sendToChannel({
          channel: FirefoxChannelsEnum.running_status,
          log: JSON.stringify({
            isRunning: true,
            log: 'Point Browser is running',
          } as LaunchProcessLog),
        })
        return
      }

      // MATBE REMOVE THIS LATER ON BUT FOR NOW WE RE-INJECT CONFIG BEFORE STARTING BROWSER
      this._createConfigFiles()

      const binFile = this._getBinFile()
      const profilePath = path.join(
        helpers.getHomePath(),
        '.point/keystore/liveprofile'
      )
      let browserCmd = `"${binFile}" --first-startup --profile "${profilePath}" --url https://point`
      if (global.platform.darwin)
        browserCmd = `open -W "${binFile}" --args --first-startup --profile "${profilePath}" --url https://point`

      this.logger.sendToChannel({
        channel: FirefoxChannelsEnum.running_status,
        log: JSON.stringify({
          isRunning: true,
          log: 'Point Browser is running',
        } as LaunchProcessLog),
      })
      this.logger.info('Launching')
      exec(browserCmd, (err, stdout, stderr) => {
        if (err) this.logger.error(ErrorsEnum.LAUNCH_ERROR, err)
        if (stderr) this.logger.error(ErrorsEnum.LAUNCH_ERROR, stderr)
        this.logger.info('Ran: STDOUT', stdout)
        this.logger.sendToChannel({
          channel: FirefoxChannelsEnum.running_status,
          log: JSON.stringify({
            isRunning: false,
            log: 'Point Browser is not running',
          } as LaunchProcessLog),
        })
      })
    } catch (error) {
      this.logger.error(ErrorsEnum.LAUNCH_ERROR, error)
      throw error
    }
  }

  /**
   * Stops the running instances of Firefox
   */
  async stop() {
    this.logger.sendToChannel({
      channel: FirefoxChannelsEnum.stop,
      log: JSON.stringify({
        started: true,
        log: 'Finding running processes for Point Browser',
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
      channel: FirefoxChannelsEnum.stop,
      log: JSON.stringify({
        started: true,
        log: 'Killed running processes for Point Browser',
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
        channel: FirefoxChannelsEnum.check_for_updates,
        log: JSON.stringify({
          isChecking: true,
          isAvailable: false,
          log: 'Checking for updates',
        } as UpdateLog),
      })
      const installInfo = helpers.getInstalledVersionInfo('firefox')
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
          channel: FirefoxChannelsEnum.check_for_updates,
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
          channel: FirefoxChannelsEnum.check_for_updates,
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
   * Unpacks the Firefox brwoser based on the platform
   */
  async _unpack({ src, dest }: { src: string; dest: string }): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const _resolve = () => {
        this.logger.sendToChannel({
          channel: FirefoxChannelsEnum.unpack,
          log: JSON.stringify({
            started: false,
            log: 'Unpacked Point Browser',
            done: true,
            progress: 100,
          } as GenericProgressLog),
        })
        this.logger.info('Unpacked')
        resolve()
      }

      try {
        this.logger.info('Unpacking')
        this.logger.sendToChannel({
          channel: FirefoxChannelsEnum.unpack,
          log: JSON.stringify({
            started: true,
            log: 'Unpacking Point Browser (this might take a few minutes)',
            done: false,
            progress: 0,
            error: false,
          } as GenericProgressLog),
        })

        if (global.platform.win32) {
          await utils.extractZip({
            src,
            dest,
            onProgress: (progress: number) => {
              this.logger.sendToChannel({
                channel: FirefoxChannelsEnum.unpack,
                log: JSON.stringify({
                  started: true,
                  log: 'Unpacking Point Browser',
                  done: false,
                  progress,
                } as GenericProgressLog),
              })
            },
          })
          _resolve()
        }

        if (global.platform.darwin) {
          dmg.mount(src, async (_err: any, dmgPath: any) => {
            try {
              const src = `${dmgPath}/Firefox.app`
              const dst = `${dest}/Firefox.app`

              const totalFiles = await helpers.countFilesinDir(src)
              let filesCopied = 0

              await fs.copy(src, dst, {
                filter: src => {
                  if (fs.statSync(src).isFile()) {
                    filesCopied++
                    const progress = Math.round(
                      (filesCopied / totalFiles) * 100
                    )

                    this.logger.sendToChannel({
                      channel: FirefoxChannelsEnum.unpack,
                      log: JSON.stringify({
                        started: true,
                        log: 'Unpacking Point Browser',
                        done: false,
                        progress,
                      } as GenericProgressLog),
                    })
                  }
                  return true // To actually copy the file
                },
              })
            } catch (error: any) {
              this.logger.error(ErrorsEnum.UNPACK_ERROR, error)
              throw error
            } finally {
              dmg.unmount(dmgPath, (error: any) => {
                if (error) {
                  this.logger.error(ErrorsEnum.UNPACK_ERROR, error)
                  throw error
                }
                _resolve()
              })
            }
          })
        }

        if (global.platform.linux) {
          const stats = fs.statSync(src)
          const progressStream = progress({ length: stats.size, time: 250 })
          progressStream.on('progress', p => {
            this.logger.sendToChannel({
              channel: FirefoxChannelsEnum.unpack,
              log: JSON.stringify({
                started: true,
                log: 'Unpacking Point Browser',
                done: false,
                progress: Math.round(p.percentage),
              } as GenericProgressLog),
            })
          })

          const readStream = fs
            .createReadStream(src)
            .pipe(progressStream)
            .pipe(bz2())
            .pipe(tarfs.extract(dest))

          readStream.on('finish', _resolve)
        }
      } catch (error: any) {
        this.logger.sendToChannel({
          channel: FirefoxChannelsEnum.unpack,
          log: JSON.stringify({
            log: 'Unpacking Error',
            error: true,
          } as GenericProgressLog),
        })
        this.logger.error(ErrorsEnum.UNPACK_ERROR, error)
        throw error
      }
    })
  }

  /**
   * Create configuration files for Firefox
   */
  _createConfigFiles(): void {
    try {
      this.logger.info('Creating configuration files')

      const pacFile = url.pathToFileURL(
        path.join(
          helpers.getLiveDirectoryPathResources(),
          'resources',
          'pac.js'
        )
      )
      let configFilename = 'firefox.cfg'
      if (global.platform.win32) {
        configFilename = 'portapps.cfg'
      }

      const autoconfigContent = `pref("general.config.filename", "${configFilename}");
pref("general.config.obscure_value", 0);
`
      const firefoxCfgContent = `
// IMPORTANT: Start your code on the 2nd line
// pref('network.proxy.type', 1)
pref("intl.locale.requested", "en-US");
pref("browser.rights.3.shown", true);
pref("browser.startup.homepage_override.mstone", "ignore");
pref('network.proxy.type', 2)
pref('network.proxy.http', 'localhost')
pref('network.proxy.http_port', 8666)
pref('browser.startup.homepage', 'https://point')
pref('startup.homepage_welcome_url', 'https://point/welcome')
pref('startup.homepage_welcome_url.additional', '')
pref('startup.homepage_override_url', '')
pref('network.proxy.allow_hijacking_localhost', true)
pref('browser.fixup.domainsuffixwhitelist.z', true)
pref('browser.fixup.domainsuffixwhitelist.point', true)
pref('browser.shell.checkDefaultBrowser', false)
pref('app.normandy.first_run', false)
pref('browser.laterrun.enabled', true)
pref('doh-rollout.doneFirstRun', true)
pref('trailhead.firstrun.didSeeAboutWelcome', true)
pref('toolkit.telemetry.reportingpolicy.firstRun', false)
pref('toolkit.startup.max_resumed_crashes', -1)
pref('browser.shell.didSkipDefaultBrowserCheckOnFirstRun', true)
pref('app.shield.optoutstudies.enabled', false)
pref('network.proxy.autoconfig_url', '${pacFile}')
pref('security.enterprise_roots.enabled', true)
pref('network.captive-portal-service.enabled', false)
pref('browser.tabs.drawInTitlebar', true)
pref('extensions.enabledScopes', 0)
pref('extensions.autoDisableScopes', 0)
pref("extensions.startupScanScopes", 15)
pref("trailhead.firstrun.branches", "nofirstrun-empty")
pref("browser.aboutwelcome.enabled", false)
pref("browser.sessionstore.resume_session_once", false)
pref("browser.sessionstore.resume_from_crash", false)
pref("browser.startup.upgradeDialog.enabled", false)
pref('security.pki.sha1_enforcement_level', 4)
`
      const policiesCfgContent = `{
  "policies": {
      "DisableAppUpdate": true
    }
}`
      // Write the autoconfig file
      fs.writeFileSync(
        path.join(this._getPrefPath(), 'autoconfig.js'),
        autoconfigContent
      )
      // Write the firefox config file
      fs.writeFileSync(
        path.join(this._getAppPath(), configFilename),
        firefoxCfgContent
      )
      // Write the policies file
      fs.writeFileSync(
        path.join(this._getPoliciesPath(), 'policies.json'),
        policiesCfgContent
      )

      this.logger.info('Created configuration files')
    } catch (error: any) {
      this.logger.error(ErrorsEnum.FIREFOX_CONFIG_ERROR, error)
      throw error
    }
  }

  /**
   * Returns the path where Firefox installation resides
   */
  _getRootPath(): string {
    if (global.platform.win32 || global.platform.darwin) {
      return path.join(helpers.getBrowserFolderPath())
    }
    return path.join(helpers.getBrowserFolderPath(), 'firefox')
  }

  /**
   * Returns the app path for the Firefox installation
   */
  _getAppPath(): string {
    const rootPath = this._getRootPath()

    let appPath = rootPath
    if (global.platform.win32) appPath = path.join(rootPath, 'app')
    if (global.platform.darwin)
      appPath = path.join(rootPath, 'Firefox.app', 'Contents', 'Resources')

    if (!fs.existsSync(appPath)) {
      fs.mkdirSync(appPath)
    }

    return appPath
  }

  /**
   * Returns the pref path for the Firefox installation
   */
  _getPrefPath(): string {
    const rootPath = this._getRootPath()

    if (global.platform.linux) return path.join(rootPath, 'defaults', 'pref')

    const defaultsPath = path.join(this._getAppPath(), 'defaults')
    const prefPath = path.join(defaultsPath, 'pref')

    if (!fs.existsSync(defaultsPath)) {
      fs.mkdirSync(defaultsPath)
    }
    if (!fs.existsSync(prefPath)) {
      fs.mkdirSync(prefPath)
    }
    return prefPath
  }

  /**
   * Returns the policies path for the Firefox installation
   */
  _getPoliciesPath(): string {
    const rootPath = this._getRootPath()
    let distributionPath = path.join(this._getAppPath(), 'distribution')
    if (global.platform.linux)
      distributionPath = path.join(rootPath, 'distribution')

    if (!fs.existsSync(distributionPath)) {
      fs.mkdirSync(distributionPath)
    }
    return distributionPath
  }

  /**
   * Returns the executable bin path for the Firefox installation
   */
  _getBinFile() {
    const rootPath = this._getRootPath()
    if (global.platform.win32) {
      // return path.join(rootPath, 'point-browser-portable.exe')
      return path.join(rootPath, 'app', 'firefox.exe')
    }
    if (global.platform.darwin) {
      return `${path.join(rootPath, 'Firefox.app')}`
    }
    // linux
    return path.join(rootPath, 'firefox')
  }

  /**
   * Returns the running instances of Firefox
   */
  async _getRunningProcess(): Promise<Process[]> {
    this.logger.info('Getting running processes')

    return await (
      await find('name', /firefox/i)
    ).filter(p => p.cmd.includes('point-browser') && !p.cmd.includes('tab'))
  }
}

export default Firefox
