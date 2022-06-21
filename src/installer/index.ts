import { InstallerChannelsEnum } from './../@types/ipc_channels'
import { app, BrowserWindow, ipcMain } from 'electron'
import welcome from '../welcome'
import baseWindowConfig from '../../shared/windowConfig'
import Logger from '../../shared/logger'
import Installer from './service'
import helpers from '../../shared/helpers'
import { getIdentifier } from '../../shared/getIdentifier'
// Types
import {
  DashboardChannelsEnum,
  GenericChannelsEnum,
} from '../@types/ipc_channels'
export { Installer }

const logger = new Logger({ module: 'installer:index' })

app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null
let installer: Installer | null

declare const INSTALLER_WINDOW_WEBPACK_ENTRY: string
declare const INSTALLER_WINDOW_PRELOAD_WEBPACK_ENTRY: string

export default function () {
  async function createWindow() {
    mainWindow = new BrowserWindow({
      ...baseWindowConfig,
      width: 640,
      height: 480,
      webPreferences: {
        ...baseWindowConfig.webPreferences,
        preload: INSTALLER_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    })

    installer = new Installer(mainWindow!)

    mainWindow.loadURL(INSTALLER_WINDOW_WEBPACK_ENTRY)

    mainWindow.on('closed', () => {
      logger.info('Closed Installer Window')
      events.forEach(event => {
        ipcMain.removeListener(event.channel, event.listener)
        logger.info('Removed event', event.channel)
      })
      mainWindow = null
      installer = null
    })
  }

  const events = [
    {
      channel: InstallerChannelsEnum.start,
      async listener() {
        await installer!.install()
        await installer!.close()
        welcome(true)
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
      channel: GenericChannelsEnum.get_identifier,
      listener() {
        mainWindow!.webContents.send(
          GenericChannelsEnum.get_identifier,
          getIdentifier()[0]
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
      logger.info('Registered event', event.channel)
    })
  }

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
