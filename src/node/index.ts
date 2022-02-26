import { BrowserWindow } from "electron"
import { https } from "follow-redirects"
import Logger from "../../shared/logger"
import fs from 'fs-extra'
import helpers from "../../shared/helpers"
import path from 'path'

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

    getNodeFileName() {
        if (global.platform.win32) {
            // TODO: Still unsure about this: we need to decide on the name
            // of the browser, check how we get the version, etc.
            return `pointnetwork-linux-v0.1.38-test.gz`
        }
        if (global.platform.darwin) {
            return `pointnetwork-macos-v0.1.38-test.gz`
        }
        // linux & mac
        return ` pointnetwork-linux-v0.1.38-test.gz`
    }

    async downloadNode() {
        const browserDir = await this.getFolderPath()
        const filename = this.getNodeFileName()
        const releasePath = path.join(browserDir, filename)
        const nodeRelease = fs.createWriteStream(releasePath)

        return await https.get(
            '',
            async (response: { pipe: (arg0: fs.WriteStream) => any }) => {
                this.installationLogger.log('Downloading Firefox...')
                await response.pipe(nodeRelease)

                return await new Promise((resolve, reject) => {
                    nodeRelease.on('finish', () => {
                        this.installationLogger.log('Downloaded Firefox')
                        const cb = async () => {
                            fs.unlink(releasePath, err => {
                                if (err) {
                                    return reject(err)
                                } else {
                                    console.log(`\nDeleted file: ${releasePath}`)
                                    this.installationLogger.log('Installed Firefox successfully')
                                    // this.launch()
                                    return resolve()
                                }
                            })

                         //   await this.createConfigFiles(osAndArch, pacFile)
                        }
                       // this.unpack(osAndArch, releasePath, browserDir, cb)
                    })
                })
            }
        )
    }
}