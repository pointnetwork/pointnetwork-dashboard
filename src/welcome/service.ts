import { BrowserWindow } from 'electron'
import fs from 'fs-extra'
import Mnemonic from 'bitcore-mnemonic'
import Logger from '../../shared/logger'
import helpers from '../../shared/helpers'
import { pickMultipleRandomly, Word } from './helpers'
// Types
import { WelcomeChannelsEnum } from '../@types/ipc_channels'

const { getKeyFromMnemonic } = require('arweave-mnemonic-keys')

class WelcomeService {
  private window: BrowserWindow
  private logger: Logger
  private mnemonic: string = ''
  private picks: Word[] = []

  constructor(window: BrowserWindow) {
    this.window = window
    this.logger = new Logger({ window, module: 'welcome' })
  }

  /**
   * Useful where we want to do some cleanup before closing the window
   */
  getGeneratedMnemonic() {
    this.window.webContents.send(
      WelcomeChannelsEnum.get_mnemonic,
      this.mnemonic
    )
    return this.mnemonic
  }

  /**
   * Useful where we want to do some cleanup before closing the window
   */
  async login() {
    if (helpers.isLoggedIn())
      throw Error(
        'Already logged in (~/.point/keystore/key.json already exists). You need to log out first.'
      )

    if (!fs.existsSync(helpers.getLiveDirectoryPath())) {
      await fs.mkdir(helpers.getLiveDirectoryPath())
    }

    const contents = JSON.stringify({ phrase: this.mnemonic })
    await fs.writeFile(helpers.getKeyFileName(), contents)

    const arKey = getKeyFromMnemonic(this.mnemonic)
    await fs.writeFile(helpers.getArweaveKeyFileName(), JSON.stringify(arKey))

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
   * Returns the dictionary of available words for seed phrase
   */
  getDictionary() {
    this.window.webContents.send(
      WelcomeChannelsEnum.get_dictionary,
      Mnemonic.Words.ENGLISH
    )
    return Mnemonic.Words.ENGLISH
  }

  /**
   * Pick words randomly and send for verification
   */
  pickRandomWords(): Word[] {
    const availableOptions = this.mnemonic.split(' ')
    this.picks = pickMultipleRandomly(availableOptions, 3).sort((a, b) => a.idx - b.idx)
    this.window.webContents.send(WelcomeChannelsEnum.pick_words, this.picks)
    return this.picks
  }

  /**
   * Verify the words entered
   */
  verifyWords(words: string[]) {
    const given = words.join('')
    const actual = this.picks.map(v => v.word).join('')

    if (given === actual) {
      this.window.webContents.send(WelcomeChannelsEnum.validate_words, true)
    } else {
      this.window.webContents.send(
        WelcomeChannelsEnum.validate_words,
        'The given words do not match'
      )
    }
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
