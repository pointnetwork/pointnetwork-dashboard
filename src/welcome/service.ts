import { BrowserWindow } from 'electron'
import * as fs from 'fs'
import Mnemonic from 'bitcore-mnemonic'
import Logger from '../../shared/logger'
import helpers from '../../shared/helpers'
// Types
import { WelcomeChannelsEnum } from '../@types/ipc_channels'

const { getKeyFromMnemonic } = require('arweave-mnemonic-keys')

class WelcomeService {
  private window: BrowserWindow
  private logger: Logger
  private mnemonic: string = ''

  constructor(window: BrowserWindow) {
    this.window = window
    this.logger = new Logger({ window, module: 'welcome' })
  }

  /**
   * Useful where we want to do some cleanup before closing the window
   */
  login() {
    if (helpers.isLoggedIn())
      throw Error(
        'Already logged in (~/.point/keystore/key.json already exists). You need to log out first.'
      )

    if (!fs.existsSync(helpers.getLiveDirectoryPath())) {
      fs.mkdirSync(helpers.getLiveDirectoryPath())
    }

    const contents = JSON.stringify({ phrase: this.mnemonic })
    fs.writeFileSync(helpers.getKeyFileName(), contents)

    const arKey = getKeyFromMnemonic(this.mnemonic)
    fs.writeFileSync(helpers.getArweaveKeyFileName(), JSON.stringify(arKey))

    this.window.webContents.send(WelcomeChannelsEnum.login)
    return true
  }

  /**
   * Returns a phrase created from the dictionary provided
   */
  async generate() {
    this.mnemonic = new Mnemonic(this.getDictionary()).toString()

    this.window.webContents.send(
      WelcomeChannelsEnum.generate_mnemonic,
      this.mnemonic
    )
  }

  /**
   * Validates the seed phrase
   */
  validate(phrase: string) {
    try {
      const words = phrase.split(' ').filter(Boolean) // ignore spaces

      if (words.length !== 12) {
        throw new Error('Invalid seed length')
      }

      const badWords = words.filter(w => !this._isWordInDictionary(w))
      if (badWords.length > 0) {
        throw new Error(
          `The following words are invalid: "${badWords.join(' ')}"`
        )
      }

      if (Mnemonic.isValid(words.join(' '))) {
        this.mnemonic = phrase
        this.window.webContents.send(
          WelcomeChannelsEnum.validate_mnemonic,
          true
        )
      } else throw new Error('Invalid phrase')
    } catch (error: any) {
      this.window.webContents.send(WelcomeChannelsEnum.validate_mnemonic, error)
    }
  }

  /**
   * Returns the dictionary of awailable words for seed phrase
   */
  getDictionary() {
    this.window.webContents.send(
      WelcomeChannelsEnum.get_dictionary,
      Mnemonic.Words.ENGLISH
    )
    return Mnemonic.Words.ENGLISH
  }

  /**
   * Returns whether the word is in the dictionary or not
   */
  _isWordInDictionary(word: string): boolean {
    const dictionary = this.getDictionary()
    return dictionary.includes(word)
  }
}

export default WelcomeService
