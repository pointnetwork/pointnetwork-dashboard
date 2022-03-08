import { app, BrowserWindow, ipcMain } from 'electron'
import WelcomeService from './services'
import dashboard from '../dashboard'
let mainWindow: BrowserWindow | null

declare const WELCOME_WINDOW_PRELOAD_WEBPACK_ENTRY: string
declare const WELCOME_WINDOW_WEBPACK_ENTRY: string

// const assetsPath =
//   process.env.NODE_ENV === 'production'
//     ? process.resourcesPath
//     : app.getAppPath()

export default function (isExplicitRun = false) {
  function createWindow() {
    mainWindow = new BrowserWindow({
      // icon: path.join(assetsPath, 'assets', 'icon.png'),
      width: 960,
      height: 560,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: WELCOME_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    })

    // debug
    //  mainWindow.webContents.openDevTools()

    mainWindow.loadURL(WELCOME_WINDOW_WEBPACK_ENTRY)

    mainWindow.on('closed', () => {
      mainWindow = null
    })
  }

  async function registerListeners() {
    const welcomeService = new WelcomeService(mainWindow!)

    ipcMain.on('welcome:generate_mnemonic', async (_, message) => {
      welcomeService.generate()
    })

    ipcMain.on('welcome:validate_mnemonic', async (_, message) => {
      welcomeService.validate(message.replace(/^\s+|\s+$/g, ''))
    })

    ipcMain.on('welcome:login', async (_, message) => {
      const result = await welcomeService.login(message)
      if (result) {
        dashboard(true)
        welcomeService.close()
      }
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
}
