import { app, BrowserWindow, ipcMain } from 'electron'
import Firefox from '../firefox'
import Docker from '../docker'

let mainWindow: BrowserWindow | null

declare const DASHBOARD_WINDOW_PRELOAD_WEBPACK_ENTRY: string
declare const DASHBOARD_WINDOW_WEBPACK_ENTRY: string

// const assetsPath =
//   process.env.NODE_ENV === 'production'
//     ? process.resourcesPath
//     : app.getAppPath()

export default function () {


  function createWindow() {
    mainWindow = new BrowserWindow({
      // icon: path.join(assetsPath, 'assets', 'icon.png'),
      width: 1100,
      height: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: DASHBOARD_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    })

    // debug
    // mainWindow.webContents.openDevTools()


    mainWindow.loadURL(DASHBOARD_WINDOW_WEBPACK_ENTRY)

    mainWindow.on('closed', () => {
      mainWindow = null
    })
  }

  async function registerListeners() {

    ipcMain.on('firefox:check', async (_, message) => {
      const firefox = new Firefox(mainWindow!)
      const firefoxInstalled = await firefox.isInstalled()
      if (!firefoxInstalled) {
          await firefox.download();
      }
      else{
        await firefox.launch();
      }
    })

    ipcMain.on('docker:check', async (_, message) => {
      const docker = new Docker(mainWindow!)
      const dockerInstalled = await docker.isInstalled()
      if (!dockerInstalled) {
          await docker.download();
      }
      else{
        await docker.startCompose();
      }
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
