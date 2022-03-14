import { app, BrowserWindow, ipcMain } from 'electron'
import welcome from '../welcome'
import baseWindowConfig from '../../shared/windowConfig'
import Logger from '../../shared/logger'
import Installer from './service'
export { Installer }


const logger = new Logger();

app.disableHardwareAcceleration()

let mainWindow: BrowserWindow | null
let installer: Installer | null

declare const INSTALLER_WINDOW_WEBPACK_ENTRY: string
declare const INSTALLER_WINDOW_PRELOAD_WEBPACK_ENTRY: string

// const assetsPath =
//   process.env.NODE_ENV === 'production'
//     ? process.resourcesPath
//     : app.getAppPath()

export default function () {
  async function createWindow() {
    mainWindow = new BrowserWindow({
      ...baseWindowConfig,
      width: 640,
      height: 440,
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
        logger.info('[installer:index.ts] Removed event', event.channel)
      })
      mainWindow = null
      installer = null
    })
  }

  const events = [
    {
      channel: 'installer:start',
      async listener() {
        await installer!.start()
        await installer!.close()
        welcome(true)
      },
    },
  ]

  async function registerListeners() {
    events.forEach(event => {
      ipcMain.on(event.channel, event.listener)
      logger.info('[installer:index.ts] Registered event', event.channel)
    })
    ipcMain.on('installer:checkUpdate', async (_, message) => {
      logger.info(
        '[installer:index.ts] TODO!! -> implement checkUpdateOrInstall method'
      )
      // new Installer(mainWindow!).checkUpdateOrInstall()
    })
  }

  app
    .on('ready', createWindow)
    .whenReady()
    .then(registerListeners)
    .catch(e => logger.error(e))

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
}
