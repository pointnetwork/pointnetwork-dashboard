import { ErrorsEnum } from './../@types/errors'
import axios from 'axios'
import { BrowserWindow } from 'electron'
import fs from 'fs-extra'
import path from 'node:path'
import helpers from '../../shared/helpers'
import Logger from '../../shared/logger'

// TODO: Add JSDoc comments
/**
 * WHAT THIS MODULE DOES
 * 1. Downloads the Point Uninstaller
 * 2. Checks for updates whether new Point Uninstaller release is available
 * 3. Launches the Point Uninstaller
 */
class Bounty {
  logger: Logger
  window: BrowserWindow
  pointDir: string = helpers.getPointPath()
  referralCode: string = '000000000000'
  isInstalledEventSent: boolean = false

  constructor({ window }: { window: BrowserWindow }) {
    this.window = window
    this.logger = new Logger({ window, module: 'bounty' })
  }

  async init () {
    await this._getReferralCode()
  }

  /**
   * Sends the saved referral code to bounty server with `event=generated`
   */
  async sendGenerated() {
    try {
      const fileContents = JSON.parse(
        (
          await fs.readFile(path.join(helpers.getPointPath(), 'infoReferral.json'))
        ).toString()
      )
      const referralCode = fileContents.referralCode

      const addressRes = await axios.get(
        'http://localhost:2468/v1/api/wallet/address'
      )
      const address = addressRes.data.data.address

      if (!fileContents.isGeneratedEventSent && address) {
        this.logger.info('Sending "event=generated" to bounty server')
        await axios.get(
          `https://bounty.pointnetwork.io/ref_success?event=generated&ref=${referralCode}&addr=${address}`
        )
        this.logger.info(
          'Sent event=generated to https://bounty.pointnetwork.io'
        )
        await fs.writeFile(
          path.join(helpers.getPointPath(), 'infoReferral.json'),
          JSON.stringify({
            ...fileContents,
            isGeneratedEventSent: true,
          })
        )
        this.logger.info('Saved "isGeneratedEvent" in "infoReferral.json"')
      }
    } catch (error) {
      this.logger.error(
        ErrorsEnum.BOUNTY_ERROR,
        'Failed to send "event=generated" to bounty server',
        error
      )
    }
  }

  /**
   * Sends the referral code to bounty server with `event=install`
   */
  async sendInstalled(): Promise<void> {
    try {
      this.logger.info('Sending "event=install" to bounty server')
      await axios.get(
        `https://bounty.pointnetwork.io/ref_success?event=install&ref=${this.referralCode}&addr=0x0000000000000000000000000000000000000000`
      )
      this.isInstalledEventSent = true
      this.logger.info('Sent event=install to https://bounty.pointnetwork.io')
      await this._saveReferralInfo()
    } catch (error) {
      this.logger.error(
        ErrorsEnum.BOUNTY_ERROR,
        'Failed to send "event=install" to bounty server',
        error
      )
    }
  }

  /**
   * Sends the referral code to bounty server with `event=install_started`
   */
  async sendInstallStarted(): Promise<void> {
    try {
      this.logger.info('Sending "event=install_started" to bounty server')
      await axios.get(
        `https://bounty.pointnetwork.io/ref_success?event=install_started&ref=${this.referralCode}&addr=0x0000000000000000000000000000000000000000`
      )
      this.logger.info(
        'Sent event=install_started to https://bounty.pointnetwork.io'
      )
    } catch (error) {
      this.logger.error(
        ErrorsEnum.BOUNTY_ERROR,
        'Failed to send "event=install_started" to bounty server',
        error
      )
    }
  }

  /**
   * Saves that referral code in ~/.point/infoReferral.json
   */
  async _saveReferralInfo() {
    try {
      this.logger.info('Saving referralCode to "infoReferral.json"')
      await fs.writeFile(
        path.join(this.pointDir, 'infoReferral.json'),
        JSON.stringify({
          referralCode: this.referralCode,
          isInstalledEventSent: this.isInstalledEventSent,
        })
      )
      this.logger.info('Saved referralCode to "infoReferral.json"')
    } catch (error) {
      this.logger.error(
        ErrorsEnum.BOUNTY_ERROR,
        'Failed to save "infoReferral.json"',
        error
      )
    }
  }

  /**
   * Reads various directories and sets the referralCode
   */
  async _getReferralCode() {
    // Get referral code from the trash folder
    let trashDir
    let trashDirContent: string[] = []

    this.logger.info('Checking for the referralCode...')
    if (global.platform.darwin) {
      try {
        this.logger.info('Reading ".Trash" directory')
        trashDir = path.join(helpers.getHomePath(), '.Trash')
        trashDirContent = await fs.readdir(trashDir)
        this.logger.info('".Trash" directory read')
      } catch (e) {
        this.logger.error(
          ErrorsEnum.BOUNTY_ERROR,
          'Not allowed to read ".Trash" directory'
        )
      }
    }

    // Get referral code from the downloads folder
    let downloadDir
    let downloadDirContent: string[] = []
    try {
      this.logger.info('Reading "Downloads" directory')
      downloadDir = path.join(helpers.getHomePath(), 'Downloads')
      downloadDirContent = await fs.readdir(downloadDir)
      this.logger.info('"Downloads" directory read')
    } catch (e) {
      this.logger.error(
        ErrorsEnum.BOUNTY_ERROR,
        'Not allowed to read "Downloads" directory'
      )
    }

    // Get referral code from the desktop folder
    let desktopDir
    let desktopDirContent: string[] = []
    try {
      this.logger.info('Reading "Desktop" directory')
      desktopDir = path.join(helpers.getHomePath(), 'Desktop')
      desktopDirContent = await fs.readdir(desktopDir)
      this.logger.info('"Desktop" directory read')
    } catch (e) {
      this.logger.error(
        ErrorsEnum.BOUNTY_ERROR,
        'Not allowed to read "Desktop" directory'
      )
    }

    // Make sure it's one of our file downloads and pick the first one
    const matchDir = [
      ...downloadDirContent,
      ...desktopDirContent,
      ...trashDirContent,
    ]
      .filter(
        (dir: string) =>
          dir.includes('point-') &&
          dir.match(/-\d{12}\./) &&
          (dir.includes('Linux-Debian-Ubuntu') ||
            dir.includes('Linux-RPM-Centos-Fedora') ||
            dir.includes('MacOS-installer') ||
            dir.includes('Windows-installer'))
      )
      .map((dir: string) => path.join(helpers.getHomePath(), dir))[0]

    let requiredDir
    if (matchDir) {
      this.logger.info('File with Referral Code exists')
      // Strip the file extension
      requiredDir = matchDir
        .replace('.tar.gz', '')
        .replace('.zip', '')
        .replace('.tar', '')
        .replace(/\(\d+\)+/g, '')
        .trim()
      // Get the referral code
      this.referralCode = requiredDir.slice(requiredDir.length - 12)
    }
    if (
      Number.isNaN(Number(this.referralCode)) ||
      Number(this.referralCode) < 0
    )
      this.referralCode = '000000000000'

    this.logger.info('Referral Code: ', this.referralCode)
  }
}

export default Bounty
