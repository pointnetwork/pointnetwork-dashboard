import fs from 'fs-extra'
import path from 'path'
import _7z from '7zip-min'
import tarfs from 'tar-fs'
import url from 'url'
import helpers from '../../shared/helpers'
import util from 'util'
import https from 'follow-redirects'
import { BrowserWindow } from 'electron'
import Logger from '../../shared/logger'

const dmg = require('dmg')
const bz2 = require('unbzip2-stream')
const find = require('find-process')
const exec = util.promisify(require('child_process').exec)

export default class {
  private window
  private installationLogger

  constructor(window: BrowserWindow) {
    this.window = window
    this.installationLogger = new Logger({ window, channel: 'installer' })
  }

  private flagPath = 'installer-finished'

  async getFolderPath() {
    return await helpers.getBrowserFolderPath()
  }

  async isInstalled() {
    this.installationLogger.log('Checking Firefox installation')
    const osAndArch = helpers.getOSAndArch()

    const binPath = await this.getBinPath(osAndArch)
    if (fs.existsSync(binPath)) {
      this.installationLogger.log('Firefox already installed')
      return true
    }
    this.installationLogger.log('Firefox not installed')
    return false
  }

  getURL(version: unknown, osAndArch: any, language: string, filename: string) {
    if (global.platform.win32) {
      return 'https://github.com/pointnetwork/phyrox-esr-portable/releases/download/test/point-browser-portable-win64-78.12.0-55.7z'
    }
    // linux & mac
    return `https://download.cdn.mozilla.net/pub/mozilla.org/firefox/releases/${version}/${osAndArch}/${language}/${filename}`
  }

  getFileName(osAndArch: any, version: unknown) {
    if (global.platform.win32) {
      // TODO: Still unsure about this: we need to decide on the name
      // of the browser, check how we get the version, etc.
      return `point-browser-portable-${osAndArch}-78.12.0-55.7z`
    }
    if (global.platform.darwin) {
      return `Firefox%20${version}.dmg`
    }
    // linux & mac
    return `firefox-${version}.tar.bz2`
  }

  async download() {
    this.installationLogger.log('Starting Firefox installation...')

    const language = 'en-US'
    const version = await this.getLastVersionFirefox() // '93.0b4'//
    const osAndArch = helpers.getOSAndArch()
    const browserDir = await this.getFolderPath()
    const pacFile = url.pathToFileURL(
      path.join(await helpers.getPNPath(), 'client', 'proxy', 'pac.js')
    )
    const filename = this.getFileName(osAndArch, version)
    const releasePath = path.join(browserDir, filename)
    const firefoxRelease = fs.createWriteStream(releasePath)
    const firefoxURL = this.getURL(version, osAndArch, language, filename)

    if (!fs.existsSync(browserDir)) {
      this.installationLogger.log('Creating browser directory')
      fs.mkdirSync(browserDir)
    }

    return https.https.get(
      firefoxURL,
      async (response: { pipe: (arg0: fs.WriteStream) => any }) => {
        this.installationLogger.log('Downloading Firefox...')
        await response.pipe(firefoxRelease)

        return await new Promise((resolve, reject) => {
          firefoxRelease.on('finish', () => {
            this.installationLogger.log('Downloaded Firefox')
            const cb = async () => {
              fs.unlink(releasePath, err => {
                if (err) {
                  return reject(err)
                } else {
                  console.log(`\nDeleted file: ${releasePath}`)
                  this.installationLogger.log('Installed Firefox successfully')
                  this.launch()
                  return resolve()
                }
              })

              await this.createConfigFiles(osAndArch, pacFile)
            }
            this.unpack(osAndArch, releasePath, browserDir, cb)
          })
        })
      }
    )
  }

  async launch() {
    const isRunning = await find('name', 'Firefox')
    if (isRunning.length > 0) {
      console.log('Firefox already Running')
      this.window.webContents.send('firefox:active', true)
      return
    }

    const osAndArch = helpers.getOSAndArch()
    const cmd = await this.getBinPath(osAndArch)
    const profilePath = path.join(
      helpers.getHomePath(),
      '.point/keystore/profile'
    )
    let webextBinary = ''
    if (global.platform.win32) {
      webextBinary = 'web-ext'
    } else {
      webextBinary = path.join(
        helpers.getHomePath(),
        '.point/src/pointnetwork-dashboard/node_modules/web-ext/bin/web-ext'
      )
      // webextBinary = 'web-ext'
    }
    // const webextBinary = path.join(await helpers.getHomePath(), ".point/src/pointnetwork-dashboard/node_modules/web-ext/bin/web-ext")
    const extPath = path.join(
      helpers.getHomePath(),
      '.point/src/pointsdk/dist/prod'
    ) // should contain manifest.json
    let webext = ''
    if (global.platform.win32) {
      webext = `"${webextBinary}" run "--firefox=${cmd}" "--firefox-profile=${profilePath}" --keep-profile-changes "--source-dir=${extPath}" --url https://point`
    } else {
      webext = `${webextBinary} run --firefox="${cmd}" --firefox-profile ${profilePath} --keep-profile-changes --source-dir ${extPath} --url https://point`
    }

    exec(webext, (error: { message: any }, _stdout: any, stderr: any) => {
      // win.webContents.send("firefox-closed")
      if (error) {
        console.log(`error: ${error.message}`)
        this.window.webContents.send('firefox:active', false)
        return
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`)
        this.window.webContents.send('firefox:active', false)
      }
    })
    this.window.webContents.send('firefox:active', true)
  }

  unpack(
    _osAndArch: any,
    releasePath: string,
    browserDir: string,
    cb: { (): Promise<void>; (): void }
  ) {
    this.installationLogger.log('Unpacking Firefox...')
    if (global.platform.win32) {
      _7z.unpack(releasePath, browserDir, err => {
        if (err) throw err
        cb()
      })
    }
    if (global.platform.darwin) {
      dmg.mount(releasePath, (_err: any, dmgPath: any) => {
        fs.copy(`${dmgPath}/Firefox.app`, `${browserDir}/Firefox.app`, err => {
          if (err) {
            console.log('Error Found:', err)
            dmg.unmount(dmgPath, (err: any) => {
              if (err) throw err
            })
            return
          }
          dmg.unmount(dmgPath, (err: any) => {
            if (err) throw err
            cb()
          })
        })
      })
      return
    }
    if (global.platform.linux || global.platform.linux) {
      const readStream = fs
        .createReadStream(releasePath)
        .pipe(bz2())
        .pipe(tarfs.extract(browserDir))
      // readStream.on('finish', () => {cb()} )
      readStream.on('finish', cb)
    }
  }

  async getRootPath(osAndArch: any) {
    if (global.platform.win32 || global.platform.darwin) {
      return path.join(await this.getFolderPath())
    }
    // linux
    return path.join(await this.getFolderPath(), 'firefox')
  }

  async getAppPath(osAndArch: any) {
    const rootPath = await this.getRootPath(osAndArch)

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

  async getPrefPath(osAndArch: any) {
    const rootPath = await this.getRootPath(osAndArch)

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

  async getBinPath(osAndArch: string) {
    const rootPath = await this.getRootPath(osAndArch)
    if (global.platform.win32) {
      return path.join(rootPath, 'point-browser-portable.exe')
    }
    if (global.platform.darwin) {
      return `${path.join(rootPath, 'Firefox.app')}`
    }
    // linux
    return path.join(rootPath, 'firefox')
  }

  async createConfigFiles(osAndArch: any, pacFile: url.URL) {
    this.installationLogger.log('Creating configuration files for Firefox...')
    if (!pacFile)
      throw Error('pacFile sent to createConfigFiles is undefined or null!')

    let networkProxyType = ''
    if (global.platform.win32) {
      networkProxyType = '1'
    }
    networkProxyType = '2'

    const autoconfigContent = `pref("general.config.filename", "firefox.cfg")
pref("general.config.obscure_value", 0)
`
    const firefoxCfgContent = `
// IMPORTANT: Start your code on the 2nd line
// pref('network.proxy.type', 1)
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
`
    const prefPath = await this.getPrefPath(osAndArch)
    const appPath = await this.getAppPath(osAndArch)

    if (global.platform.win32) {
      // Portapps creates `defaults/pref/autonfig.js` for us, same contents.
      //
      // Portapps also creates `portapps.cfg`, which is equivalent to *nix's firefox.cfg.
      // We're just appending our preferences.
      fs.appendFile(
        path.join(appPath, 'portapps.cfg'),
        firefoxCfgContent,
        err => {
          if (err) {
            console.error(err)
          }
        }
      )
    }
    if (
      global.platform.linux ||
      global.platform.linux ||
      global.platform.darwin
    ) {
      fs.writeFile(
        path.join(prefPath, 'autoconfig.js'),
        autoconfigContent,
        err => {
          if (err) {
            console.error(err)
          }
        }
      )

      fs.writeFile(
        path.join(appPath, 'firefox.cfg'),
        firefoxCfgContent,
        err => {
          if (err) {
            console.error(err)
          }
        }
      )
    }
    this.installationLogger.log('Created configuration files for Firefox')
  }

  async isFirefoxRanOnce() {
    const pointPath = await module.exports.getPointPath()
    return fs.pathExistsSync(path.join(pointPath, this.flagPath))
  }

  async setFirefoxRanOnce() {
    const pointPath = await module.exports.getPointPath()
    fs.writeFileSync(path.join(pointPath, this.flagPath), '')
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
            console.error(error.message)
          }
        })
      })
    })
  }
}
