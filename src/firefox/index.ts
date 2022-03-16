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

  getURL(version: unknown, osAndArch: any, language: string, filename: string) {
    if (global.platform.win32) {
      return 'https://github.com/pointnetwork/pointnetwork-dashboard/releases/download/v0.1.0/point-browser.zip'
    }
    // linux & mac
    return `https://download.cdn.mozilla.net/pub/mozilla.org/firefox/releases/${version}/${osAndArch}/${language}/${filename}`
  }

  getFileName(version: unknown) {
    if (global.platform.win32) {
      // TODO: Still unsure about this: we need to decide on the name
      // of the browser, check how we get the version, etc.
      return `point-browser.zip`
    }
    if (global.platform.darwin) {
      return `Firefox%20${version}.dmg`
    }
    // linux & mac
    return `firefox-${version}.tar.bz2`
  }

  download = async () =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve, reject) => {
      this.installationLogger.info(
        InstallationStepsEnum.BROWSER,
        'Starting Firefox installation...'
      )

      const language = 'en-US'
      const version = await this.getLastVersionFirefox() // '93.0b4'//
      const osAndArch = helpers.getOSAndArch()
      const browserDir = helpers.getBrowserFolderPath()
      const pacFile = url.pathToFileURL(
        path.join(
          helpers.getLiveDirectoryPathResources(),
          'resources',
          'pac.js'
        )
      )
      const filename = this.getFileName(version)
      const releasePath = path.join(browserDir, filename)
      const firefoxRelease = fs.createWriteStream(releasePath)
      const firefoxURL = this.getURL(version, osAndArch, language, filename)

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

  async launch() {
    // const isRunning = await find('name', /firefox*/gi)
    // if (isRunning.length > 0) {
    //   logger.info('Firefox already Running')
    //   this.window.webContents.send('firefox:active', true)
    //   return
    // }
    const cmd = await this.getBinPath()
    const profilePath = path.join(
      helpers.getHomePath(),
      '.point/keystore/liveprofile'
    )

    const browserCmd = `${cmd} --first-startup --profile ${profilePath} --url https://point`

    this.window.webContents.send('firefox:active', true)
    try {
      const { stderr } = await exec(browserCmd)
      if (stderr) this.window.webContents.send('firefox:active', false)
    } catch (error) {
      this.window.webContents.send('firefox:active', false)
    }
  }

  getKillCmd(pid: number) {
    return global.platform.win32 ? `taskkill /F /PID ${pid}` : `kill ${pid}`
  }

  async close() {
    const processes: Process[] = await find('name', /firefox/i)

    const pointBrowserParentProcesses = processes.filter(
      p => p.cmd.includes('point-browser') && !p.cmd.includes('tab')
    )

    if (pointBrowserParentProcesses.length > 0) {
      for (const p of pointBrowserParentProcesses) {
        logger.info(`[firefox:close] Killing PID ${p.pid}...`)
        const cmdOutput = await exec(this.getKillCmd(p.pid))
        logger.info(`[firefox:close] Output of "kill ${p.pid}":`, cmdOutput)
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
        'Firefox.app',
        'Contents',
        'MacOS',
        'firefox'
      )}`
    }
    // linux
    return path.join(rootPath, 'firefox')
  }

  async createConfigFiles(pacFile: url.URL) {
    this.installationLogger.info('Creating configuration files for Firefox...')
    if (!pacFile)
      throw Error('pacFile sent to createConfigFiles is undefined or null!')

    let networkProxyType = ''
    if (global.platform.win32) {
      networkProxyType = '1'
    }
    networkProxyType = '2'

    const autoconfigContent = `pref("general.config.filename", "firefox.cfg");
pref("general.config.obscure_value", 0);
`
    const firefoxCfgContent = `
// IMPORTANT: Start your code on the 2nd line
// pref('network.proxy.type', 1)
pref("intl.locale.requested", "en-US");
pref("browser.rights.3.shown", true);
pref("browser.startup.homepage_override.mstone", "ignore");
pref('network.proxy.type', ${networkProxyType})
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
pref('browser.shell.didSkipDefaultBrowserCheckOnFirstRun', true)
pref('app.shield.optoutstudies.enabled', false)
pref('network.proxy.autoconfig_url', '${pacFile}')
pref('security.enterprise_roots.enabled', true)
pref('network.captive-portal-service.enabled', false)
pref('browser.tabs.drawInTitlebar', true)
pref('extensions.enabledScopes', 0)
pref('extensions.autoDisableScopes', 0)
pref("extensions.startupScanScopes", 15);
`
    const policiesCfgContent = `{
  "policies": {
      "DisableAppUpdate": true
    }
}`

    const prefPath = await this.getPrefPath()
    const appPath = await this.getAppPath()
    const policiesPath = await this.getPoliciesPath()

    if (global.platform.win32) {
      // Portapps creates `defaults/pref/autonfig.js` for us, same contents.
      //
      // Portapps also creates `portapps.cfg`, which is equivalent to *nix's firefox.cfg.
      // We're just appending our preferences.
      fs.writeFileSync(path.join(appPath, 'portapps.cfg'), firefoxCfgContent)
    }
    if (global.platform.linux || global.platform.darwin) {
      fs.writeFile(
        path.join(prefPath, 'autoconfig.js'),
        autoconfigContent,
        err => {
          if (err) {
            logger.error(err)
          }
        }
      )

      fs.writeFile(
        path.join(appPath, 'firefox.cfg'),
        firefoxCfgContent,
        err => {
          if (err) {
            logger.error(err)
          }
        }
      )
    }

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
}
