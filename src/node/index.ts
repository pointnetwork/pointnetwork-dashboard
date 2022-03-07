import { BrowserWindow } from 'electron'
import { https } from 'follow-redirects'
import Logger from '../../shared/logger'
import fs from 'fs-extra'
import helpers from '../../shared/helpers'
import path from 'path'
import util from 'util'

const decompress = require('decompress')
const decompressTargz = require('decompress-targz')

const exec = util.promisify(require('child_process').exec)
export default class {
  private installationLogger
  private window

  constructor(window: BrowserWindow) {
    this.window = window
    this.installationLogger = new Logger({ window, channel: 'installer' })
  }

  getURL(filename: string) {
    return `https://github.com/pointnetwork/pointnetwork/releases/download/v0.1.41/${filename}`
  }

  getNodeFileName() {
    if (global.platform.win32) return `point-win-v0.1.41.tar.gz`

    if (global.platform.darwin) return `point-macos-v0.1.41.tar.gz`

    return `point-linux-v0.1.41.tar.gz`
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
}
