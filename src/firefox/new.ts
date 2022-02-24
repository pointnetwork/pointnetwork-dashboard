import { BrowserWindow } from 'electron'
import path from 'path'
import axios from 'axios'
import fs from 'fs-extra'
import tarfs from 'tar-fs'
import { https } from 'follow-redirects'
import Logger from '../../shared/logger'
import helpers from '../../shared/helpers'
import extractDmg from 'extract-dmg'
import { execSync } from 'child_process'
const bz2 = require('unbzip2-stream')

class Firefox {
  private window
  private installationLogger

  constructor(window: BrowserWindow) {
    this.window = window
    this.installationLogger = new Logger({ window, channel: 'installer' })
  }

  static isInstalled = () => {}

  private getDownloadSpecs = async () => {
    let filename, downloadURL

    const version = await (
      await axios.get(
        'https://product-details.mozilla.org/1.0/firefox_versions.json'
      )
    ).data.LATEST_FIREFOX_VERSION

    if (global.platform.win32) {
      filename = `firefox-${version}.zip`
      // TODO: Change this URL
      downloadURL =
        'https://ftp.mozilla.org/pub/firefox/nightly/latest-mozilla-central/firefox-99.0a1.en-US.win64.zip'
    }
    if (global.platform.darwin) {
      filename = `Firefox%20${version}.dmg`
      downloadURL = `https://download.cdn.mozilla.net/pub/mozilla.org/firefox/releases/${version}/${helpers.getOSAndArch()}/en-US/${filename}`
    }
    if (global.platform.linux) {
      filename = `firefox-${version}.tar.bz2`
      downloadURL = `https://download.cdn.mozilla.net/pub/mozilla.org/firefox/releases/${version}/${helpers.getOSAndArch()}/en-US/${filename}`
    }

    const installationPath = helpers.getBrowserFolderPath()
    const downloadPath = path.join(helpers.getBrowserFolderPath(), filename)

    return { filename, downloadURL, downloadPath, installationPath }
  }

  download = async () => {
    const { downloadURL, downloadPath, installationPath } =
      await this.getDownloadSpecs()
    // Set the download stream
    const downloadStream = fs.createWriteStream(downloadPath!)
    // Start download
    https.get(downloadURL!, async response => {
      this.installationLogger.log('Downloading Firefox...')

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
    // When download finishes, start installation
    downloadStream.on('close', async () => {
      this.installationLogger.log('Downloaded Firefox')
      await this.extract(downloadPath!, installationPath)
    })
  }

  private extract = async (downloadPath: string, installationPath: string) => {
    this.installationLogger.log('Extracting Firefox...')
    if (global.platform.win32) {
      this.installationLogger.log(
        execSync(`unzip -o ${downloadPath} -d ${installationPath}`).toString()
      )
    }
    if (global.platform.darwin) {
      await extractDmg(downloadPath!, installationPath)
    }
    if (global.platform.linux) {
      fs.createReadStream(downloadPath)
        .pipe(bz2())
        .pipe(tarfs.extract(installationPath))
    }
    this.installationLogger.log('Extracted Firefox')
  }
}

export default Firefox
