import { app, BrowserWindow, ipcMain } from 'electron'
import WelcomeService from './service'
import dashboard from '../dashboard'
import baseWindowConfig from '../../shared/windowConfig'
import Logger from '../../shared/logger'
import helpers from '../../shared/helpers'
// Types
import {
  DashboardChannelsEnum,
  GenericChannelsEnum,
  WelcomeChannelsEnum,
} from '../@types/ipc_channels'

const logger = new Logger({ module: 'welcome_window' })

let mainWindow: BrowserWindow | null
let welcomeService: WelcomeService | null

declare const WELCOME_WINDOW_PRELOAD_WEBPACK_ENTRY: string
declare const WELCOME_WINDOW_WEBPACK_ENTRY: string

export default function (isExplicitRun = false) {
  function createWindow() {
    mainWindow = new BrowserWindow({
      ...baseWindowConfig,
      width: 960,
      height: 560,
      webPreferences: {
        ...baseWindowConfig.webPreferences,
        preload: WELCOME_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    })

    // debug
    // mainWindow.webContents.openDevTools()
    welcomeService = new WelcomeService(mainWindow!)

    mainWindow.loadURL(WELCOME_WINDOW_WEBPACK_ENTRY)

    mainWindow.on('close', () => {
      logger.info('Closed Welcome Window')
      events.forEach(event => {
        ipcMain.removeListener(event.channel, event.listener)
        logger.info('Removed event', event.channel)
      })
    })
    mainWindow.on('closed', () => {
      mainWindow = null
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
        welcomeService!.copy(message)
      },
    },
    {
      channel: WelcomeChannelsEnum.paste_mnemonic,
      listener(_: any) {
        welcomeService!.paste()
      },
    },
    {
      channel: WelcomeChannelsEnum.login,
      async listener(_: any, message: string) {
        const result = await welcomeService!.login(message)
        if (result) {
          dashboard(true)
          welcomeService!.close()
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
        mainWindow!.webContents.send(
          DashboardChannelsEnum.get_version,
          helpers.getInstalledDashboardVersion()
        )
      },
    },
    // Generic channels
    {
      channel: GenericChannelsEnum.minimize_window,
      listener() {
        mainWindow!.minimize()
      },
    },
    {
      channel: GenericChannelsEnum.close_window,
      listener() {
        mainWindow!.close()
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
