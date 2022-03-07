import * as fs from 'fs'
import helpers from '../../shared/helpers'
import { BrowserWindow } from 'electron'

const Mnemonic = require('bitcore-mnemonic')
const { getKeyFromMnemonic } = require('arweave-mnemonic-keys')

class WelcomeService {
  private win

  constructor(win: BrowserWindow) {
    this.win = win
  }

  async login(phrase: any, firstTime = false) {
    if (await helpers.isLoggedIn())
      throw Error(
        'Already logged in (~/.point/keystore/key.json already exists). You need to log out first.'
      )

    if (!fs.existsSync(await helpers.getLiveDirectoryPath())) {
      fs.mkdirSync(await helpers.getLiveDirectoryPath())
    }

    const contents = JSON.stringify(phrase)
    fs.writeFileSync(await helpers.getKeyFileName(), contents)

    // arweave
    const arKey = getKeyFromMnemonic(phrase.phrase)
    fs.writeFileSync(
      await helpers.getArweaveKeyFileName(),
      JSON.stringify(arKey)
    )

    return true
  }

  async generate() {
    this.win.webContents.send(
      'welcome:mnemonic_generated',
      new Mnemonic().toString()
    )
  }

  async validate(message: any) {
    this.win.webContents.send(
      'welcome:mnemonic_validated',
      Mnemonic.isValid(message)
    )
  }

  close() {
    this.win.close()
  }

  tryToShowError(e: any) {
    this.win.webContents.send('error', { e })
  }
}

export default WelcomeService
