import fs from 'fs-extra'
import path from 'path'
import extract from 'extract-zip'
import tarfs from 'tar-fs'
import url from 'url'
import helpers from '../../shared/helpers'
import util from 'util'
import https from 'follow-redirects'
import { BrowserWindow } from 'electron'
import Logger from '../../shared/logger'
import type { Process } from '../@types/process'
import { InstallationStepsEnum } from '../@types/installation'
import progress from 'progress-stream'
import moment from 'moment'

const rimraf = require('rimraf')
const dmg = require('dmg')
const bz2 = require('unbzip2-stream')
const find = require('find-process')
const exec = util.promisify(require('child_process').exec)

const logger = new Logger()
export default class {
  private window
  private installationLogger

  constructor(window: BrowserWindow) {
    this.window = window
    this.installationLogger = new Logger({ window, channel: 'installer' })
  }

  async isInstalled() {
    this.installationLogger.info('Checking Firefox installation')

    const binPath = await this.getBinPath()
    if (fs.existsSync(binPath)) {
      this.installationLogger.info('Firefox already installed')
      return true
    }
    this.installationLogger.info('Firefox not installed')
    return false
  }

  getURLMacAndLinux(
    version: unknown,
    osAndArch: any,
    language: string,
    filename: string
  ) {
    return `https://download.cdn.mozilla.net/pub/mozilla.org/firefox/releases/${version}/${osAndArch}/${language}/${filename}`
  }

  async getURLWindows() {
    const url = await helpers.getPortableDashboardDownloadURL()
    return url
  }

  getFileName(version: unknown) {
    if (global.platform.darwin) {
      return `Firefox%20${version}.dmg`
    }
    // linux
    return `firefox-${version}.tar.bz2`
  }

  download = async () =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve, reject) => {
      this.installationLogger.info(
        InstallationStepsEnum.BROWSER,
        'Starting Point Browser installation...'
      )

      const language = 'en-US'
      const version = await this.getLastVersionFirefox() // '93.0b4'//
      const osAndArch = helpers.getOSAndArch()
      const browserDir = helpers.getBrowserFolderPath()
      const pointPath = helpers.getPointPath()
      const pacFile = url.pathToFileURL(
        path.join(
          helpers.getLiveDirectoryPathResources(),
          'resources',
          'pac.js'
        )
      )

      let firefoxURL = ''
      let filename = ''
      if (global.platform.win32) {
        firefoxURL = await this.getURLWindows()
        filename = firefoxURL.split('/').pop()!
      } else {
        filename = this.getFileName(version)
        firefoxURL = this.getURLMacAndLinux(
          version,
          osAndArch,
          language,
          filename
        )
      }

      const releasePath = path.join(browserDir, filename)
      const firefoxRelease = fs.createWriteStream(releasePath)

      if (!fs.existsSync(browserDir)) {
        this.installationLogger.info('Creating browser directory')
        fs.mkdirSync(browserDir)
      }

      https.https.get(firefoxURL, async response => {
        this.installationLogger.info(
          InstallationStepsEnum.BROWSER,
          'Downloading Firefox...'
        )
        await response.pipe(firefoxRelease)

        const total = response.headers['content-length']
        let downloaded = 0
        let percentage = 0
        let temp = 0
        response.on('data', chunk => {
          downloaded += Buffer.from(chunk).length

          temp = Math.round((downloaded * 100) / Number(total))
          if (temp !== percentage) {
            percentage = temp

            // Downloading is the first half of the process (second is unpacking),
            // hence the division by 2.
            const progress = Math.round(Number(percentage) / 2)

            this.installationLogger.info(
              `${InstallationStepsEnum.BROWSER}:${progress}`,
              'Downloading'
            )
          }
        })
      })

      firefoxRelease.on('finish', () => {
        this.installationLogger.info(
          InstallationStepsEnum.BROWSER,
          'Downloaded Firefox'
        )
        const cb = async () => {
          fs.unlink(releasePath, err => {
            if (err) {
              this.installationLogger.error(err)
              reject(err)
            } else {
              this.installationLogger.info(`\nDeleted file: ${releasePath}`)
              this.window.webContents.send('firefox:setVersion', version)
              this.window.webContents.send('firefox:finishDownload', true)
              // write firefox version to a file
              fs.writeFile(
                path.join(pointPath, 'infoFirefox.json'),
                JSON.stringify({
                  installedReleaseVersion: version,
                  lastCheck: moment().unix(),
                  isInitialized: false,
                }),
                'utf8',
                err => {
                  if (err) {
                    this.installationLogger.error(
                      'An error occured while infoFirefox.json JSON Object to File.'
                    )
                    return console.log(err)
                  }

                  this.installationLogger.info(
                    'infoFirefox.json file has been saved.'
                  )
                }
              )
              resolve(
                this.installationLogger.info(
                  `${InstallationStepsEnum.BROWSER}:100`,
                  'Installed Firefox successfully'
                )
              )
            }
          })

          await this.createConfigFiles(pacFile)
        }
        this.unpack(releasePath, browserDir, cb)
      })
    })

  getIdExtension = async () =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve, reject) => {
      const version = await helpers.getlatestSDKReleaseVersion()
      const extensionPath = helpers.getPointPath()
      const downloadManifest = this.getURL('manifest.json', version)
      const downloadPathManifest = path.join(extensionPath, 'manifest.json')
      const manifest = fs.createWriteStream(downloadPathManifest)
      https.https.get(downloadManifest, function (response) {
        response.pipe(manifest)
      })
      manifest.on('finish', async () => {
        manifest.close()
        console.log('Download Manifest Completed')
        resolve(true)
      })
    })

  downloadInstallPointSDK = async () =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve, reject) => {
      const pointPath = helpers.getPointPath()
      const version = await helpers.getlatestSDKReleaseVersion()
      const extensionPath = helpers.getLiveExtensionsDirectoryPathResources()
      const filename = helpers.getSDKFileName(version)
      const manifestPath = helpers.getPointPath()
      const downloadPathManifest = path.join(manifestPath, 'manifest.json')

      const man = await fs.readFile(downloadPathManifest, 'utf8')
      const idExtension = JSON.parse(man).browser_specific_settings.gecko.id
      const downloadPath = path.join(extensionPath, `${idExtension}.xpi`)
      if (fs.existsSync(downloadPath)) {
        fs.unlink(downloadPath)
      }
      const downloadStream = fs.createWriteStream(downloadPath)
      const downloadUrl = this.getURL(filename, version)

      // Setting `extensions.autoDisableScopes` to 0
      // to automatically enable new PointSDK version
      // this.setDisableScopes(false)
      helpers.setIsFirefoxInit(false)

      https.https.get(downloadUrl, async response => {
        this.installationLogger.info(
          InstallationStepsEnum.POINT_SDK,
          'Downloading PointSDK...'
        )

        await response.pipe(downloadStream)

        const total = response.headers['content-length']
        let downloaded = 0
        let percentage = 0
        let temp = 0
        response.on('data', chunk => {
          downloaded += Buffer.from(chunk).length

          temp = Math.round((downloaded * 100) / Number(total))
          if (temp !== percentage) {
            percentage = temp

            // Don't let this progress reach 100% as there are some minor final tasks after.
            const progress = percentage > 0 ? Math.round(percentage) - 1 : 0

            this.installationLogger.info(
              `${InstallationStepsEnum.POINT_SDK}:${progress}`,
              'Downloading'
            )
          }
        })
      })

      downloadStream.on('close', async () => {
        this.installationLogger.info(
          `${InstallationStepsEnum.POINT_SDK}:100`,
          'Downloaded SDK'
        )
        this.window.webContents.send('pointSDK:finishDownload', true)

        // stringify JSON Object
        fs.writeFile(
          path.join(pointPath, 'infoSDK.json'),
          JSON.stringify({
            installedReleaseVersion: version,
            lastCheck: moment().unix(),
          }),
          'utf8',
          function (err: any) {
            if (err) {
              logger.info('An error occured while writing JSON Object to File.')
              return logger.info(err)
            }

            logger.info('JSON file has been saved.')
          }
        )
        resolve(
          this.installationLogger.info(
            `${InstallationStepsEnum.POINT_SDK}:100`,
            'Installed PointSDK successfully'
          )
        )
      })
    })

  async checkSDKVersion() {
    const installedVersion = helpers.getInstalledSDKVersion()
    const lastCheck = moment.unix(installedVersion.lastCheck)
    if (moment().diff(lastCheck, 'hours') >= 1) {
      const latestReleaseVersion = await helpers.getlatestSDKReleaseVersion()

      logger.info('installed', installedVersion.installedReleaseVersion)
      logger.info('last', latestReleaseVersion)
      if (installedVersion.installedReleaseVersion !== latestReleaseVersion) {
        logger.info('sdk Update need it')
        this.window.webContents.send('sdk:update', true)
        await this.getIdExtension()
        await this.downloadInstallPointSDK()
      } else {
        this.window.webContents.send('sdk:update', false)
      }
    } else {
      this.window.webContents.send('sdk:update', false)
    }
  }

  getURL(filename: string, version: string) {
    const githubURL = helpers.getGithubURL()
    return `${githubURL}/pointnetwork/pointsdk/releases/download/${version}/${filename}`
  }

  async launch() {
    // const processes = await find('name', /firefox*/gi)
    // if (processes.length > 0) {
    //   for (const p of processes) {
    //     if (!p.bin.match(/point-browser/)) continue
    //     logger.info('Firefox already Running')
    //     this.window.webContents.send('firefox:active', true)
    //     return
    //   }
    // }
    const cmd = await this.getBinPath()
    const profilePath = path.join(
      helpers.getHomePath(),
      '.point/keystore/liveprofile'
    )

    let browserCmd = `"${cmd}" --first-startup --profile "${profilePath}" --url https://point`
    if (global.platform.darwin)
      browserCmd = `open -W "${cmd}" --args --first-startup --profile "${profilePath}" --url https://point`

    this.window.webContents.send('firefox:active', true)
    try {
      await exec(browserCmd)
      this.window.webContents.send('firefox:active', false)
    } catch (error) {
      this.window.webContents.send('firefox:active', false)
    }
  }

  getKillCmd(pid: number) {
    return global.platform.win32 ? `taskkill /F /PID "${pid}"` : `kill "${pid}"`
  }

  async close() {
    const processes: Process[] = await find('name', /firefox/i)

    const pointBrowserParentProcesses = processes.filter(
      p => p.cmd.includes('point-browser') && !p.cmd.includes('tab')
    )

    if (pointBrowserParentProcesses.length > 0) {
      for (const p of pointBrowserParentProcesses) {
        logger.info(`[firefox:close] Killing PID ${p.pid}...`)
        try {
          const cmdOutput = await exec(this.getKillCmd(p.pid))
          logger.info(`[firefox:close] Output of "kill ${p.pid}":`, cmdOutput)
        } catch (err) {
          logger.error(`[firefox:close] Output of "kill ${p.pid}":`, err)
        }
      }
    }
  }

  async unpack(
    releasePath: string,
    browserDir: string,
    cb: { (): Promise<void>; (): void }
  ) {
    this.installationLogger.info(
      InstallationStepsEnum.BROWSER,
      'Unpacking Firefox (this can take a few minutes)'
    )
    if (global.platform.win32) {
      try {
        await extract(releasePath, {
          dir: browserDir,
          onEntry: (_, zipfile) => {
            const extracted = zipfile.entriesRead
            const total = zipfile.entryCount

            // Unpacking is the second half of the process (first is downloading),
            // hence the division by 2 and the plus 50.
            const progress = Math.round(((extracted / total) * 100) / 2 + 50)

            this.installationLogger.info(
              `${InstallationStepsEnum.BROWSER}:${progress}`,
              'Unpacking Firefox'
            )
          },
        })
        this.installationLogger.info(
          InstallationStepsEnum.BROWSER,
          'Extraction complete'
        )
        cb()
      } catch (err: any) {
        logger.info(err)
      }
    }
    if (global.platform.darwin) {
      dmg.mount(releasePath, async (_err: any, dmgPath: any) => {
        try {
          const src = `${dmgPath}/Firefox.app`
          const dst = `${browserDir}/Firefox.app`

          const totalFiles = await helpers.countFilesinDir(src)
          let filesCopied = 0

          await fs.copy(src, dst, {
            filter: src => {
              if (fs.statSync(src).isFile()) {
                filesCopied++

                // Unpacking is the second half of the process (first is downloading),
                // hence the division by 2 and the plus 50.
                const progress = Math.round(
                  ((filesCopied / totalFiles) * 100) / 2 + 50
                )

                this.installationLogger.info(
                  `${InstallationStepsEnum.BROWSER}:${progress}`,
                  'Unpacking Firefox'
                )
              }
              return true // To actually copy the file
            },
          })
        } catch (err) {
          logger.info('Error Unpacking Firefox:', err)
        } finally {
          dmg.unmount(dmgPath, (err: any) => {
            if (err) throw err
            cb()
          })
        }
      })
    }
    if (global.platform.linux || global.platform.linux) {
      const stats = fs.statSync(releasePath)
      const progressStream = progress({ length: stats.size, time: 250 })
      progressStream.on('progress', p => {
        // Unpacking is the second half of the process (first is downloading),
        // hence the division by 2 and the plus 50.
        const progress = Math.round(p.percentage / 2 + 50)
        this.installationLogger.info(
          `${InstallationStepsEnum.BROWSER}:${progress}`,
          'Unpacking Firefox'
        )
      })

      const readStream = fs
        .createReadStream(releasePath)
        .pipe(progressStream)
        .pipe(bz2())
        .pipe(tarfs.extract(browserDir))

      readStream.on('finish', cb)
    }
  }

  async getRootPath() {
    if (global.platform.win32 || global.platform.darwin) {
      return path.join(helpers.getBrowserFolderPath())
    }
    // linux
    return path.join(helpers.getBrowserFolderPath(), 'firefox')
  }

  async getAppPath() {
    const rootPath = await this.getRootPath()

    if (global.platform.win32 || global.platform.darwin) {
      let appPath = ''
      if (global.platform.darwin) {
        appPath = path.join(rootPath, 'Firefox.app', 'Contents', 'Resources')
      } else {
        appPath = path.join(rootPath, 'app')
      }

      if (!fs.existsSync(appPath)) {
        fs.mkdirSync(appPath)
      }

      return appPath
    }

    // linux
    return rootPath
  }

  async getPrefPath() {
    const rootPath = await this.getRootPath()

    if (global.platform.win32 || global.platform.darwin) {
      let appPath = ''
      if (global.platform.darwin) {
        appPath = path.join(rootPath, 'Firefox.app', 'Contents', 'Resources')
      } else {
        appPath = path.join(rootPath, 'app')
      }

      const defaultsPath = path.join(appPath, 'defaults')
      const prefPath = path.join(defaultsPath, 'pref')

      if (!fs.existsSync(appPath)) {
        fs.mkdirSync(appPath)
      }
      if (!fs.existsSync(defaultsPath)) {
        fs.mkdirSync(defaultsPath)
      }
      if (!fs.existsSync(prefPath)) {
        fs.mkdirSync(prefPath)
      }

      return prefPath
    }
    // linux. all directories already exist.
    return path.join(rootPath, 'defaults', 'pref')
  }

  async getPoliciesPath() {
    const rootPath = await this.getRootPath()
    let distributionPath

    if (global.platform.win32 || global.platform.darwin) {
      let appPath = ''
      if (global.platform.darwin) {
        appPath = path.join(rootPath, 'Firefox.app', 'Contents', 'Resources')
      } else {
        appPath = path.join(rootPath, 'app')
      }

      distributionPath = path.join(appPath, 'distribution')
    } else {
      // linux
      distributionPath = path.join(rootPath, 'distribution')
    }

    if (!fs.existsSync(distributionPath)) {
      fs.mkdirSync(distributionPath)
    }
    return distributionPath
  }

  async getBinPath() {
    const rootPath = await this.getRootPath()
    if (global.platform.win32) {
      // return path.join(rootPath, 'point-browser-portable.exe')
      return path.join(rootPath, 'app', 'firefox.exe')
    }
    if (global.platform.darwin) {
      return `${path.join(
        rootPath,
        'Firefox.app'
      )}`
    }
    // linux
    return path.join(rootPath, 'firefox')
  }

  async createConfigFiles(pacFile: url.URL) {
    this.installationLogger.info('Creating configuration files for Firefox...')
    if (!pacFile)
      throw Error('pacFile sent to createConfigFiles is undefined or null!')

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
`
    const policiesCfgContent = `{
  "policies": {
      "DisableAppUpdate": true
    }
}`

    const prefPath = await this.getPrefPath()
    const appPath = await this.getAppPath()
    const policiesPath = await this.getPoliciesPath()

    fs.writeFile(
      path.join(prefPath, 'autoconfig.js'),
      autoconfigContent,
      err => {
        if (err) {
          logger.error(err)
        }
      }
    )

    fs.writeFile(path.join(appPath, configFilename), firefoxCfgContent, err => {
      if (err) {
        logger.error(err)
      }
    })

    fs.writeFile(
      path.join(policiesPath, 'policies.json'),
      policiesCfgContent,
      err => {
        if (err) {
          logger.error('Error writing browser settings: ' + err)
        }
      }
    )

    this.installationLogger.info('Created configuration files for Firefox')
  }

  async setDisableScopes(flag: boolean) {
    this.installationLogger.info('Setting extensions.autoDisableScopes to 15')

    let configFilename = 'firefox.cfg'
    if (global.platform.win32) {
      configFilename = 'portapps.cfg'
    }
    const appPath = await this.getAppPath()
    const configPath = path.join(appPath, configFilename)

    fs.readFile(configPath, 'utf8', (err, data) => {
      if (err) {
        this.installationLogger.error(
          `Setting extensions.autoDisableScopes to 15, ${err}`
        )
        return err
      }

      let result
      if (flag)
        result = data.replace(
          /pref\('extensions.autoDisableScopes', 0\)/g,
          "pref('extensions.autoDisableScopes', 15)"
        )
      else
        result = data.replace(
          /pref\('extensions.autoDisableScopes', 15\)/g,
          "pref('extensions.autoDisableScopes', 0)"
        )

      fs.writeFile(configPath, result, 'utf8', err => {
        if (err) {
          this.installationLogger.error(
            `Setting extensions.autoDisableScopes to 15, ${err}`
          )
          return err
        }
      })
    })
  }

  async getLastVersionFirefox() {
    const url = 'https://product-details.mozilla.org/1.0/firefox_versions.json'

    return new Promise(resolve => {
      https.https.get(url, (res: { on: (arg0: string, arg1: any) => void }) => {
        let data = ''

        res.on('data', (chunk: string) => {
          data += chunk
        })

        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            resolve(json.LATEST_FIREFOX_VERSION)
          } catch (error: any) {
            logger.error(error.message)
          }
        })
      })
    })
  }

  async checkFirefoxVersion() {
    const pointPath = helpers.getPointPath()
    const installedVersion = helpers.getInstalledFirefoxVersion()

    const latestReleaseVersion = await this.getLastVersionFirefox()

    this.installationLogger.info(
      'firefox version installed',
      installedVersion.installedReleaseVersion
    )
    this.window.webContents.send(
      'firefox:setVersion',
      installedVersion.installedReleaseVersion
    )
    this.installationLogger.info(
      'firefox last version',
      String(latestReleaseVersion)
    )
    if (installedVersion.installedReleaseVersion !== latestReleaseVersion) {
      this.installationLogger.info('Firefox Update needed')
      this.window.webContents.send('firefox:update', true)

      // Closes firefox
      this.close().then(() =>
        // Delete firefox folder
        setTimeout(() => {
          if (fs.existsSync(path.join(pointPath, 'contracts')))
            rimraf.sync(path.join(pointPath, 'src', 'point-browser', 'firefox'))
        }, 500)
      )
    } else {
      this.window.webContents.send('firefox:update', false)
    }
  }
}
