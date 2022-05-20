import * as fs from 'fs'
import helpers from '../../shared/helpers'
import { BrowserWindow, clipboard } from 'electron'
import { generatePhrase, validatePhrase, getDictionary } from './helpers'

import { getKeyFromMnemonic } from 'arweave-mnemonic-keys'

class WelcomeService {
  private win

  constructor(win: BrowserWindow) {
    this.win = win
  }

  async login(phrase: any) {
    if (helpers.isLoggedIn())
      throw Error(
        'Already logged in (~/.point/keystore/key.json already exists). You need to log out first.'
      )

    if (!fs.existsSync(helpers.getLiveDirectoryPath())) {
      fs.mkdirSync(helpers.getLiveDirectoryPath())
    }

    const contents = JSON.stringify(phrase)
    fs.writeFileSync(helpers.getKeyFileName(), contents)

    // arweave
    const arKey = getKeyFromMnemonic(phrase.phrase)
    fs.writeFileSync(helpers.getArweaveKeyFileName(), JSON.stringify(arKey))

    return true
  }

  async generate() {
    this.win.webContents.send('welcome:mnemonic_generated', generatePhrase())
  }

  async validate(message: string) {
    this.win.webContents.send(
      'welcome:mnemonic_validated',
      validatePhrase(message)
    )
  }

  async copy(message: string) {
    clipboard.writeText(message)
    this.win.webContents.send('welcome:mnemonic_copied')
  }

  async paste() {
    const message = clipboard.readText('clipboard').toLowerCase()
    this.win.webContents.send('welcome:mnemonic_pasted', message)
  }

  async getDictionary() {
    this.win.webContents.send('welcome:set_dictionary', getDictionary())
  }

  close() {
    this.win.close()
  }

  tryToShowError(e: any) {
    this.win.webContents.send('error', { e })
  }
}

export default WelcomeService
