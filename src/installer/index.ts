import { app, BrowserWindow, ipcMain } from 'electron'
import Firefox from '../firefox'
import welcome from '../welcome'
import Node from '../node'
import Installer from './service'
export { Installer }

let mainWindow: BrowserWindow | null

declare const INSTALLER_WINDOW_WEBPACK_ENTRY: string
declare const INSTALLER_WINDOW_PRELOAD_WEBPACK_ENTRY: string

// const assetsPath =
//   process.env.NODE_ENV === 'production'
//     ? process.resourcesPath
//     : app.getAppPath()

export default function () {
  function createWindow() {
    mainWindow = new BrowserWindow({
      // icon: path.join(assetsPath, 'assets', 'icon.png'),
      width: 640,
      height: 400,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: INSTALLER_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    })

    mainWindow.loadURL(INSTALLER_WINDOW_WEBPACK_ENTRY)

    mainWindow.on('closed', () => {
      mainWindow = null
    })
  }

  async function registerListeners() {
    ipcMain.on('installer:start', async (_, message) => {
      const installer = new Installer(mainWindow!)
      await installer.start()
      const firefox = new Firefox(mainWindow!)
      if (!(await firefox.isInstalled())) await firefox.download()
      await Node.getInstance(mainWindow!).download()
      await installer.close()
      welcome(true)
    })
  }

  app
    .on('ready', createWindow)
    .whenReady()
    .then(registerListeners)
    .catch(e => console.error(e))

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
