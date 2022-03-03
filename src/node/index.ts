import { BrowserWindow } from 'electron'
import { http, https } from 'follow-redirects'
import Logger from '../../shared/logger'
import fs from 'fs-extra'
import helpers from '../../shared/helpers'
import path from 'path'
import util from 'util'

const decompress = require('decompress')
const decompressTargz = require('decompress-targz')
const find = require('find-process')

const exec = util.promisify(require('child_process').exec)
export default class Node {
  private static _instance: Node
  private installationLogger
  private window

  private constructor(window: BrowserWindow) {
    this.window = window
    this.installationLogger = new Logger({ window, channel: 'installer' })
  }

  static getInstance(window: BrowserWindow | null) {
    if (this._instance) {
      return this._instance;
    }
    if (!window) {
      throw new Error("window should be BrowserWindow to create instance");
    }
    this._instance = new Node(window);
    return this._instance;
  }

  getURL(filename: string) {
    return `https://github.com/pointnetwork/pointnetwork/releases/download/v0.1.40/${filename}`
  }

  getNodeFileName() {
    if (global.platform.win32) return `point-win-v0.1.40.tar.gz`

    if (global.platform.darwin) return `point-macos-v0.1.40.tar.gz`

    return `point-linux-v0.1.40.tar.gz`
  }

  async getFolderPath() {
    return await helpers.getNodeExecutablePath()
  }

  async getBinPath() {
    const rootPath = await this.getFolderPath()
    if (global.platform.win32) {
      // return path.join(rootPath, 'point-browser-portable.exe')
      return path.join(rootPath, 'win', 'point.exe')
    }
    if (global.platform.darwin) {
      return `${path.join(rootPath, 'macos', 'point')}`
    }
    // linux
    return path.join(rootPath, 'linux', 'point')
  }

  async isInstalled() {
    this.installationLogger.log('Checking Point executable exist')

    const binPath = await this.getBinPath()
    if (fs.existsSync(binPath)) {
      this.installationLogger.log('Point already downloaded')
      return true
    }
    this.installationLogger.log('Point does not exist')
    return false
  }

  download = () =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve, reject) => {
      const pointPath = helpers.getPointPath()
      const filename = this.getNodeFileName()

      const donwloadPath = path.join(pointPath, filename)
      if (!donwloadPath) {
        fs.mkdirpSync(donwloadPath)
      }
      const downloadStream = fs.createWriteStream(donwloadPath)
      const downloadUrl = this.getURL(filename)

      https.get(downloadUrl, async response => {
        this.installationLogger.log('Downloading Node...')
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
            this.installationLogger.log(
              `Downloaded: ${Number(percentage).toFixed(0)}%`
            )
          }
        })
      })

      downloadStream.on('close', async () => {
        this.installationLogger.log('Downloaded Node')
        decompress(donwloadPath, helpers.getPointPath(), {
          plugins: [decompressTargz()],
        }).then(() => {
          resolve(this.installationLogger.log('Files decompressed'))
        })
      })
    })

  async launch() {
    console.log('Launching Node')
    if (this.pointNodeCheck()) {
      console.log('Node is running')
      return
    }
    if (!this.isInstalled()) {
      console.log('Node is not downloaded')
      return
    }
    const pointPath = helpers.getPointPath()

    let file = path.join(pointPath, 'bin', 'linux', 'point')
    if (global.platform.win32)
      file = path.join(pointPath, 'bin', 'win', 'point')
    if (global.platform.darwin)
      file = path.join(pointPath, 'bin', 'macos', 'point')

    exec(file, (error: { message: any }, _stdout: any, stderr: any) => {
      console.log('Launched Node')
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
  }

  pointNodeCheck(): boolean {
    http.get("http://localhost:2468/v1/api/status/ping", (res) => {
      this.window.webContents.send("pointNode:checked", true)
      return true
    }).on('error', err => {
      this.window.webContents.send("pointNode:checked", false)
      console.log(err)
    })
    return false
  }

  async stopNode() {
    console.log('Stoping Node...')
    const process = await find('name', 'point', true)

    if (process.length > 0) {

      let cmd = `kill ${process[0].pid}`
      if (global.platform.win32)
        cmd = `taskkill /F /PID ${process[0].pid}`

      exec(cmd, (error: { message: any }, _stdout: any, stderr: any) => {
        console.log('Kill Node')
        // win.webContents.send("firefox-closed")
        if (error) {
          console.log(`error: ${error.message}`)
          return
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`)
        }
      })
    }
  }

}

