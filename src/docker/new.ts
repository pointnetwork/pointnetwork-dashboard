import { BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs-extra'
import { https } from 'follow-redirects'
import Logger from '../../shared/logger'
import helpers from '../../shared/helpers'
import sudo from 'sudo-prompt'
import extractDmg from 'extract-dmg'
import { execFileSync } from 'child_process'

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
        this.installationLogger.log('Downloaded Docker')
        await this.install(downloadPath!, unpackDestinationPath)
      })
    }

    if (global.platform.linux) {
      this.execSudoCommand(
        'apt-get remove docker docker-engine docker.io containerd runc'
      )
      this.execSudoCommand('apt-get update')
      this.execSudoCommand(
        'apt-get install ca-certificates curl gnupg lsb-release'
      )
      this.execSudoCommand(
        'curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg'
      )
      this.execSudoCommand(
        `echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null`
      )
      this.execSudoCommand('apt-get update')
      this.execSudoCommand(
        'apt-get install docker-ce docker-ce-cli containerd.io'
      )
    }
  }

  private install = async (
    downloadPath: string,
    unpackDestinationPath?: string
  ) => {
    this.installationLogger.log('Starting Docker installation...')
    try {
      if (global.platform.win32) {
        const x = execFileSync(downloadPath)
        this.installationLogger.log(x.toString())
      }

      if (global.platform.darwin) {
        this.installationLogger.log('Extracting Docker...')
        await extractDmg(downloadPath, unpackDestinationPath)
        this.installationLogger.log('Extracted Docker')
      }
    } catch (error) {
      this.installationLogger.error(error)
    }
  }

  private execSudoCommand = (command: string) => {
    sudo.exec(command, { name: 'Point Installer' }, (error, stdout, stderr) => {
      this.installationLogger.log('Executed: ', command)
      if (error) {
        this.installationLogger.error('Installation error: ', error.message)
      }
      if (stdout) {
        this.installationLogger.log('Installation STDOUT: ', stdout.toString())
      }
      if (stderr) {
        this.installationLogger.error(
          'Installation STDERR: ',
          stderr.toString()
        )
      }
    })
  }
}

export default Docker