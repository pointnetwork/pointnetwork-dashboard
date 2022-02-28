import { BrowserWindow } from "electron"
import { https } from "follow-redirects"
import Logger from "../../shared/logger"
import fs from 'fs-extra'
import helpers from "../../shared/helpers"
import path from 'path'
import util from 'util'

const decompress = require('decompress');
const decompressTargz = require('decompress-targz');


const exec = util.promisify(require('child_process').exec)
export default class {
    private installationLogger
    private window

    constructor(window: BrowserWindow) {
        this.window = window
        this.installationLogger = new Logger({ window, channel: 'installer' })
    }

    async getFolderPath() {
        return await helpers.getNodeExecutablePath()
    }

    async getFolderExec() {
        return await helpers.getNodeExecutableFile()
    }


    getURL(filename: string) {
        return `https://github.com/pointnetwork/pointnetwork/releases/download/v0.1.39/${filename}`
    }

    getNodeFileName() {
        if (global.platform.win32) {
            // TODO: Still unsure about this: we need to decide on the name
            // of the browser, check how we get the version, etc.
            return `pointnetwork-linux-v0.1.39-test.gz`
        }
        if (global.platform.darwin) {
            return `point-macos-v0.1.39.tar.gz`
        }
        // linux & mac
        return `pointnetwork-linux-v0.1.39-test.gz`
    }

    async downloadNode() {


        const browserDir = await this.getFolderPath()
        const browserExec = await this.getFolderExec()
        const filename = this.getNodeFileName()
        const releasePath = path.join(browserDir, filename)
        const nodeRelease = fs.createWriteStream(releasePath)
        const nodeURL = this.getURL(filename)
        console.log('URL', nodeURL)
        console.log('path', releasePath)

        if (fs.existsSync(browserExec)) {
            this.installationLogger.log('Creating browser directory')
            return 
          }

        return https.get(
            nodeURL,
            async (response: { pipe: (arg0: fs.WriteStream) => any }) => {
                this.installationLogger.log('Downloading Node...')
                await response.pipe(nodeRelease)

                return await new Promise((resolve, reject) => {
                    nodeRelease.on('finish', async () => {
                        this.installationLogger.log('Downloaded Node')
                        decompress(releasePath, browserDir, {
                            plugins: [
                                decompressTargz()
                            ]
                        }).then(() => {
                            console.log('Files decompressed');
                            const cb = async () => {
                                fs.unlink(releasePath, err => {
                                    if (err) {
                                        return reject(err)
                                    } else {
                                        console.log(`\nDeleted file: ${releasePath}`)
                                        this.installationLogger.log('Installed Node successfully')
                                        // this.launch()
                                        return resolve()
                                    }
                                })
                            }
                        })
                    })
                })
            }
        )
    }

    async launch() {
        const browserDir = await this.getFolderPath()
        const file = browserDir + '/bin/macos/point'
        console.log(file)
        exec(file, (error: { message: any }, _stdout: any, stderr: any) => {
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
}