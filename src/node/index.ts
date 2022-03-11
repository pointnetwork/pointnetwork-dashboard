import { BrowserWindow } from 'electron'
import { http, https } from 'follow-redirects'
import Logger from '../../shared/logger'
import fs from 'fs-extra'
import helpers from '../../shared/helpers'
import path from 'path'
import util from 'util'

const rimraf = require("rimraf");
const decompress = require('decompress')
const decompressTargz = require('decompress-targz')
const find = require('find-process')

const exec = util.promisify(require('child_process').exec)
export default class Node {
  private installationLogger
  private window
  private pid: any
  private killCmd: string = ''

  constructor(window: BrowserWindow) {
    this.window = window
    this.installationLogger = new Logger({ window, channel: 'installer' })
    this.launch()
  }

  getURL(filename: string, version: string) {
    
    return `https://github.com/pointnetwork/pointnetwork/releases/download/${version}/${filename}`
  }

  getNodeFileName(version: string) {

    if (global.platform.win32) return `point-win-${version}.tar.gz`

    if (global.platform.darwin) return `point-macos-${version}.tar.gz`

    return `point-linux-${version}.tar.gz`
  }

  async getBinPath() {
    const binPath = await helpers.getBinPath()
    if (global.platform.win32) {
      return path.join(binPath, 'win', 'point.exe')
    }
    if (global.platform.darwin) {
      return `${path.join(binPath, 'macos', 'point')}`
    }
    // linux
    return path.join(binPath, 'linux', 'point')
  }

  async isInstalled() {
    this.installationLogger.log('Checking PointNode exists or node')

    const binPath = await this.getBinPath()
    if (fs.existsSync(binPath)) {
      this.installationLogger.log('PointNode already downloaded')
      return true
    }

    this.installationLogger.log('PointNode does not exist')
    return false
  }

  download = () =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve, reject) => {
      const version = await helpers.getLastNodeVersion()
      const pointPath = helpers.getPointPath()
      const filename = this.getNodeFileName(version)

      const downloadPath = path.join(pointPath, filename)
      if (!downloadPath) {
        fs.mkdirpSync(downloadPath)
      }
      const downloadStream = fs.createWriteStream(downloadPath)
      const downloadUrl = this.getURL(filename, version)

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
        decompress(downloadPath, helpers.getPointPath(), {
          plugins: [decompressTargz()],
        }).then(() => {
          fs.unlinkSync(downloadPath)
          this.window.webContents.send('pointNode:finishDownload', true)
          resolve(this.installationLogger.log('Files decompressed'))

          // stringify JSON Object
          fs.writeFile(path.join(pointPath, 'infoNode.json'),  JSON.stringify({nodeVersionInstalled: version}), 'utf8', function (err) {
            if (err) {
              console.log("An error occured while writing JSON Object to File.")
              return console.log(err);
            }

            console.log("JSON file has been saved.");
          })
          
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
      file = `"${path.join(pointPath, 'bin', 'win', 'point')}"`
    if (global.platform.darwin)
      file = path.join(pointPath, 'bin', 'macos', 'point')

    let cmd = `NODE_ENV=production ${file}`
    if (global.platform.win32) cmd = `set NODE_ENV=production && ${file}`

    exec(cmd, (error: { message: any }, _stdout: any, stderr: any) => {
      console.log('Launched Node')
      if (error) {
        console.log(`pointnode launch exec error: ${error.message}`)
      }
      if (stderr) {
        console.log(`pointnode launch exec stderr: ${stderr}`)
      }
    })
    this.getProcess()
  }

  pointNodeCheck(): boolean {
    http
      .get('http://localhost:2468/v1/api/status/ping', res => {
        this.window.webContents.send('pointNode:checked', true)
        return true
      })
      .on('error', err => {
        this.window.webContents.send('pointNode:checked', false)
        console.log(err)
      })
    return false
  }

  async getProcess() {
    console.log('Checking PointNode PID')
    const process = await find('name', 'point', true)
    if (process.length > 0) {
      console.log('Found running process', process)
      this.pid = process[0].pid
      console.log('Process ID', this.pid)
      this.killCmd = `kill ${this.pid}`
      if (global.platform.win32) this.killCmd = `taskkill /F /PID ${this.pid}`
    }
  }

  async stopNode() {
    if (this.pid) {
      console.log('Stopping Node...', this.killCmd)
      const result  = await exec(this.killCmd)
      console.log('Sotoped Message',result);
    }
  }

  async checkNodeVersion() {

    const pointPath = helpers.getPointPath()
    const installedVersion = helpers.getInstalledVersion()

    const lastVersion = await helpers.getLastNodeVersion()
    
    console.log('installed',installedVersion.nodeVersionInstalled )
    console.log('last',lastVersion )
    if (installedVersion.nodeVersionInstalled !== lastVersion ) {
      console.log('Node Update need it')
      this.window.webContents.send('node:update', true)
      this.stopNode().then(()=>{
        setTimeout(() => {
          if (fs.existsSync(path.join(pointPath, 'contracts'))) rimraf.sync(path.join(pointPath, 'contracts'));
          if (fs.existsSync(path.join(pointPath, 'bin'))) rimraf.sync(path.join(pointPath, 'bin'));    
        }, 500);   
      })
    }else{
      this.window.webContents.send('node:update', false)
    }
  }
}


