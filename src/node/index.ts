import { BrowserWindow } from 'electron'
import { https } from 'follow-redirects'
import Logger from '../../shared/logger'
import fs from 'fs-extra'
import helpers from '../../shared/helpers'
import path from 'path'
import util from 'util'
import axios from 'axios'
import { InstallationStepsEnum } from '../@types/installation'

const rimraf = require('rimraf')
const decompress = require('decompress')
const decompressTargz = require('decompress-targz')
const find = require('find-process')
const logger = new Logger()
const exec = util.promisify(require('child_process').exec)
export default class Node {
  private installationLogger
  private window
  private pid: string[] = []
  private killCmd: string[] = []

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

  async isInstalled(): Promise<boolean> {
    this.installationLogger.info('Checking PointNode exists or node')

    const binPath = await this.getBinPath()
    if (fs.existsSync(binPath)) {
      this.installationLogger.info('PointNode already downloaded')
      return true
    }

    this.installationLogger.info('PointNode does not exist')
    return false
  }

  download = () =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve, reject) => {
      const version = await helpers.getlatestReleaseVersion()
      const pointPath = helpers.getPointPath()
      const filename = this.getNodeFileName(version)

      const downloadPath = path.join(pointPath, filename)
      if (!downloadPath) {
        fs.mkdirpSync(downloadPath)
      }
      const downloadStream = fs.createWriteStream(downloadPath)
      const downloadUrl = this.getURL(filename, version)

      https.get(downloadUrl, async response => {
        this.installationLogger.info(
          InstallationStepsEnum.POINT_NODE,
          'Downloading Node...'
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
              `${InstallationStepsEnum.POINT_NODE}:${progress}`,
              'Downloading'
            )
          }
        })
      })

      downloadStream.on('close', async () => {
        this.installationLogger.info(
          `${InstallationStepsEnum.POINT_NODE}:100`,
          'Downloaded Node'
        )

        decompress(downloadPath, helpers.getPointPath(), {
          plugins: [decompressTargz()],
        }).then(() => {
          fs.unlinkSync(downloadPath)
          this.window.webContents.send('pointNode:finishDownload', true)
          resolve(
            this.installationLogger.info(
              InstallationStepsEnum.POINT_NODE,
              'Files decompressed'
            )
          )

          // stringify JSON Object
          fs.writeFile(
            path.join(pointPath, 'infoNode.json'),
            JSON.stringify({ installedReleaseVersion: version }),
            'utf8',
            function (err: any) {
              if (err) {
                logger.info(
                  'An error occured while writing JSON Object to File.'
                )
                return logger.info(err)
              }

              logger.info('JSON file has been saved.')
            }
          )
        })
      })
    })

  async launch() {
    logger.info('Launching Node')
    if (await this.pointNodeCheck()) {
      logger.info('Node is running')
      return
    }
    if (!(await this.isInstalled())) {
      logger.info('Node is not downloaded')
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
      logger.info('Launched Node')
      if (error) {
        logger.info(`pointnode launch exec error: ${error.message}`)
      }
      if (stderr) {
        logger.info(`pointnode launch exec stderr: ${stderr}`)
      }
    })
    await this.getProcess()
  }

  async pointNodeCheck(): Promise<boolean> {
    try {
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,
      })
      const res = await axios.get('https://point/v1/api/status/meta', {
        timeout: 3000,
        proxy: {
          host: 'localhost',
          port: 8666,
          protocol: 'https',
        },
        httpsAgent,
      })
      this.window.webContents.send(
        'pointNode:checked',
        res.data.data.pointNodeVersion
      )
      return true
    } catch (e: any) {
      if (e.message.match('ECONNREFUSED')) {
        logger.info('Point is not running yet, retrying')
      } else {
        logger.error('Node check failed: ', e.message)
      }
      this.window.webContents.send('pointNode:checked', null)
      return false
    }
  }

  async getProcess() {
    logger.info('Checking PointNode PID')
    const process = await find('name', 'point', true)
    if (process.length > 0) {
      logger.info(`Found running process ${process}`)
      this.killCmd = process.map((obj: { pid: any }) => {
        let command = `kill ${obj.pid}`
        if (global.platform.win32) command = `taskkill /F /PID ${obj.pid}`
        return command
      })
      logger.info(`cmd: ${this.killCmd}`)
    }
  }

  async stopNode() {
    if (this.pid) {
      logger.info(`Stopping Node... ${this.killCmd}`)
      this.killCmd.forEach(async cmd => {
        const result = await exec(cmd)
        logger.info(`Stopped Message ${result}`)
      })
    }
  }

  async checkNodeVersion() {
    const pointPath = helpers.getPointPath()
    const installedVersion = helpers.getInstalledVersion()

    const latestReleaseVersion = await helpers.getlatestReleaseVersion()

    logger.info('installed', installedVersion.installedReleaseVersion)
    logger.info('last', latestReleaseVersion)
    if (installedVersion.installedReleaseVersion !== latestReleaseVersion) {
      logger.info('Node Update need it')
      this.window.webContents.send('node:update', true)
      await this.getProcess()
      setTimeout(() => {
        this.stopNode().then(() => {
          if (fs.existsSync(path.join(pointPath, 'contracts')))
            rimraf.sync(path.join(pointPath, 'contracts'))
          if (fs.existsSync(path.join(pointPath, 'bin')))
            rimraf.sync(path.join(pointPath, 'bin'))
        })
      }, 500)
    } else {
      this.window.webContents.send('node:update', false)
    }
  }
}
