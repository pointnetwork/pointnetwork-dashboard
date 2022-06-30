import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import WelcomeService from './services'
import dashboard from '../dashboard'
import baseWindowConfig from '../../shared/windowConfig'
import Logger from '../../shared/logger'
import helpers from '../../shared/helpers'
import {
  DashboardChannelsEnum,
  GenericChannelsEnum,
} from '../@types/ipc_channels'

const logger = new Logger()

let mainWindow: BrowserWindow | null
let welcomeService: WelcomeService | null

declare const WELCOME_WINDOW_PRELOAD_WEBPACK_ENTRY: string
declare const WELCOME_WINDOW_WEBPACK_ENTRY: string

const MESSAGES = {
  uninstallConfirmation: {
    title: 'Uninstall Point Network',
    message:
      'Are you sure you want to uninstall Point Network? Clicking Yes will also close the Point Dashboard.',
    buttons: {
      confirm: 'Yes',
      cancel: 'No',
    },
  },
}
// const assetsPath =
//   process.env.NODE_ENV === 'production'
//     ? process.resourcesPath
//     : app.getAppPath()

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
        logger.info('[welcome:index.ts] Removed event', event.channel)
      })
    })
    mainWindow.on('closed', () => {
      mainWindow = null
      welcomeService = null
    })
  }

  const events = [
    {
      channel: 'welcome:generate_mnemonic',
      listener() {
        welcomeService!.generate()
      },
    },
    {
      channel: 'welcome:validate_mnemonic',
      listener(_: any, message: string) {
        welcomeService!.validate(message.replace(/^\s+|\s+$/g, ''))
      },
    },
    {
      channel: 'welcome:copy_mnemonic',
      listener(_: any, message: string) {
        welcomeService!.copy(message)
      },
    },
    {
      channel: 'welcome:paste_mnemonic',
      listener(_: any) {
        welcomeService!.paste()
      },
    },
    {
      channel: 'welcome:login',
      async listener(_: any, message: string) {
        const result = await welcomeService!.login(message)
        if (result) {
          dashboard(true)
          welcomeService!.close()
        }
      },
    },
    {
      channel: 'welcome:get_dictionary',
      listener() {
        welcomeService!.getDictionary()
      },
    },
    {
      channel: 'welcome:launchUninstaller',
      async listener() {
        const confirmationAnswer = dialog.showMessageBoxSync({
          type: 'question',
          title: MESSAGES.uninstallConfirmation.title,
          message: MESSAGES.uninstallConfirmation.message,
          buttons: [
            MESSAGES.uninstallConfirmation.buttons.confirm,
            MESSAGES.uninstallConfirmation.buttons.cancel,
          ],
        })

        if (confirmationAnswer === 0) {
          mainWindow?.destroy()
        }
      },
    },
    {
      channel: DashboardChannelsEnum.get_version,
      listener() {
        mainWindow!.webContents.send(
          DashboardChannelsEnum.get_version,
          helpers.getInstalledDashboardVersion()
        )
      },
    },
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
      logger.info('[welcome:index.ts] Registered event', event.channel)
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
