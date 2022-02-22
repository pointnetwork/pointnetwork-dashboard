import { BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs-extra'
import { https } from 'follow-redirects'
import Logger from '../../shared/logger'
import helpers from '../../shared/helpers'
import sudo from 'sudo-prompt'
import extractDmg from 'extract-dmg'

class Docker {
  private window
  private installationLogger

  constructor(window: BrowserWindow) {
    this.window = window
    this.installationLogger = new Logger({ channel: 'installer', window })
  }

  private getDownloadSpecs = () => {
    let downloadURL, downloadPath, unpackDestinationPath

    if (global.platform.win32) {
      downloadURL =
        'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe'
      downloadPath = path.join(__dirname, 'Docker Desktop Installer.exe')
    }
    if (global.platform.darwin) {
      downloadURL = 'https://desktop.docker.com/mac/main/amd64/Docker.dmg'
      downloadPath = path.join(__dirname, 'Docker.dmg')
      unpackDestinationPath = helpers.getPointSoftwarePath()
    }

    return { downloadURL, downloadPath, unpackDestinationPath }
  }

  download = async () => {
    if (global.platform.win32 || global.platform.darwin) {
      const { downloadURL, downloadPath, unpackDestinationPath } =
        this.getDownloadSpecs()
      // Set the download stream
      const downloadStream = fs.createWriteStream(downloadPath!)
      // Start download
      await https.get(downloadURL!, async response => {
        this.installationLogger.log('Downloading Docker...')

        await response.pipe(downloadStream)
      })
      // When download finishes, start installation
      downloadStream.on('finish', async () => {
        this.installationLogger.log('Downloaded Docker')
        await this.install(downloadPath!, unpackDestinationPath)
      })
    }

    if (global.platform.linux) {
      sudo.exec('apt-get update')
      sudo.exec(
        'apt-get install apt-transport-https ca-certificates curl gnupg lsb-release'
      )
      sudo.exec(
        'curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg'
      )
      sudo.exec(
        `echo 'deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable' | tee /etc/apt/sources.list.d/docker.list > /dev/null`
      )
      sudo.exec('apt-get update')
      sudo.exec('apt-get install docker-ce docker-ce-cli containerd.io')
    }
  }

  private install = async (
    downloadPath: string,
    unpackDestinationPath?: string
  ) => {
    this.installationLogger.log('Starting Docker installation...')
    if (global.platform.win32) {
      sudo.exec(downloadPath, {}, (error, stdout, stderr) => {
        if (error) {
          this.installationLogger.log(error.message)
        }
        if (stdout) {
          this.installationLogger.log(stdout.toString())
        }
        if (stderr) {
          this.installationLogger.log(stderr.toString())
        }
      })
    }

    if (global.platform.darwin) {
      await extractDmg(downloadPath, unpackDestinationPath)
    }
  }
}

export default Docker
