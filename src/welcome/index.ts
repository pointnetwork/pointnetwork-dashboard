import { app, BrowserWindow, ipcMain, clipboard } from 'electron'
import WelcomeService from './service'
import dashboard from '../dashboard'
import baseWindowConfig from '../../shared/windowConfig'
import Logger from '../../shared/logger'
import helpers from '../../shared/helpers'
import { getIdentifier } from '../../shared/getIdentifier'
// Types
import {
  DashboardChannelsEnum,
  GenericChannelsEnum,
  WelcomeChannelsEnum,
} from '../@types/ipc_channels'

const logger = new Logger({ module: 'welcome_window' })

let window: BrowserWindow | null
let welcomeService: WelcomeService | null

declare const WELCOME_WINDOW_PRELOAD_WEBPACK_ENTRY: string
declare const WELCOME_WINDOW_WEBPACK_ENTRY: string

export default function (isExplicitRun = false) {
  function createWindow() {
    window = new BrowserWindow({
      ...baseWindowConfig,
      width: 960,
      height: 560,
      webPreferences: {
        ...baseWindowConfig.webPreferences,
        preload: WELCOME_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    })

    welcomeService = new WelcomeService(window!)

    window.loadURL(WELCOME_WINDOW_WEBPACK_ENTRY)

    window.on('close', () => {
      logger.info('Closing Welcome Window')
      logger.info('Removing all event listeners')
      ipcMain.removeAllListeners()
      logger.info('Removed all event listeners')
    })

    window.on('closed', () => {
      logger.info('Closed Welcome Window')
      window = null
      welcomeService = null
    })
  }

  const events = [
    // Welcome channels
    {
      channel: WelcomeChannelsEnum.generate_mnemonic,
      listener() {
        welcomeService!.generate()
      },
    },
    {
      channel: WelcomeChannelsEnum.validate_mnemonic,
      listener(_: any, message: string) {
        welcomeService!.validate(message.replace(/^\s+|\s+$/g, ''))
      },
    },
    {
      channel: WelcomeChannelsEnum.copy_mnemonic,
      listener(_: any, message: string) {
        clipboard.writeText(message)
        window?.webContents.send(WelcomeChannelsEnum.copy_mnemonic)
      },
    },
    {
      channel: WelcomeChannelsEnum.paste_mnemonic,
      listener() {
        window?.webContents.send(
          WelcomeChannelsEnum.paste_mnemonic,
          clipboard.readText('clipboard').toLowerCase()
        )
      },
    },
    {
      channel: WelcomeChannelsEnum.login,
      async listener(_: any, message: string) {
        const result = await welcomeService!.login(message)
        if (result) {
          window?.close()
          dashboard(true)
        }
      },
    },
    {
      channel: WelcomeChannelsEnum.get_dictionary,
      listener() {
        welcomeService!.getDictionary()
      },
    },
    // Dashboard channels
    {
      channel: DashboardChannelsEnum.get_version,
      listener() {
        window!.webContents.send(
          DashboardChannelsEnum.get_version,
          helpers.getInstalledDashboardVersion()
        )
      },
    },
    // Generic channels
    {
      channel: GenericChannelsEnum.get_identifier,
      listener() {
        window?.webContents.send(
          GenericChannelsEnum.get_identifier,
          getIdentifier()[0]
        )
      },
    },
    {
      channel: GenericChannelsEnum.minimize_window,
      listener() {
        window!.minimize()
      },
    },
    {
      channel: GenericChannelsEnum.close_window,
      listener() {
        window!.close()
      },
    },
  ]

  async function registerListeners() {
    events.forEach(event => {
      ipcMain.on(event.channel, event.listener)
      logger.info('Registered event', event.channel)
    })
  }

  if (isExplicitRun) {
    createWindow()
    registerListeners()
  }

  if (!isExplicitRun) {
    app
      .on('ready', createWindow)
      .whenReady()
      .then(registerListeners)
      .catch(e => logger.error(e))

    app.on('window-all-closed', () => {
      app.quit()
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  }
}
