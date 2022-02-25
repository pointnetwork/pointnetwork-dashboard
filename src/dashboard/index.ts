import { app, BrowserWindow, ipcMain } from 'electron'
import Firefox from '../firefox'
import Docker from '../docker'
import helpers from '../../shared/helpers'

let mainWindow: BrowserWindow | null

declare const DASHBOARD_WINDOW_PRELOAD_WEBPACK_ENTRY: string
declare const DASHBOARD_WINDOW_WEBPACK_ENTRY: string
declare const DOCKER_LOG_WINDOW_WEBPACK_ENTRY: string
declare const DOCKER_LOG_WINDOW_PRELOAD_WEBPACK_ENTRY: string

// const assetsPath =
//   process.env.NODE_ENV === 'production'
//     ? process.resourcesPath
//     : app.getAppPath()

export default function (isExplicitRun = false) {

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
    const docker = new Docker(mainWindow!)
    const firefox = new Firefox(mainWindow!)
    ipcMain.on('firefox:check', async (_, message) => {
      
      const firefoxInstalled = await firefox.isInstalled()
      if (!firefoxInstalled) {
        await firefox.download();
      }
      else{
        await firefox.launch();
      }
    })

    ipcMain.on('firefox:lunch', async (_, message) => {
      await firefox.launch();
    })

    ipcMain.on('docker:check', async (_, message) => {
      const dockerInstalled = await docker.isInstalled()
      if (!dockerInstalled) {
        await docker.download();
      }
      else{
        await docker.startCompose()
       
      }
    })

    ipcMain.on('node:check', async (_, message) => {
      await docker.pointNodeCheck()
    })

    ipcMain.on('logOut', async (_, message) => {
      mainWindow.close()
      helpers.logout()
    })

    ipcMain.on('node:window', async (_, message) => {
      if(mainWindow){
        const child = new BrowserWindow({parent: mainWindow,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: DOCKER_LOG_WINDOW_PRELOAD_WEBPACK_ENTRY,
          },});
        child.show();
        child.loadURL(DOCKER_LOG_WINDOW_WEBPACK_ENTRY)
        child.on('show', async () => {
          await docker.getLogsNode(child)
        })

      }

    })
  }

  if (isExplicitRun) {
    createWindow();
    registerListeners();
  }

  if (!isExplicitRun) {
    app
      .on('ready', createWindow)
      .whenReady()
      .then(registerListeners)
      .catch(e => console.error(e))

    app.on('window-all-closed', (goDashboard) => {
      if (process.platform !== 'darwin') {
        console.log('WHAT')
        app.quit()
      }
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  }
}
