import { app, BrowserWindow, ipcMain } from 'electron'
import WelcomeService from './services'
import dashboard from '../dashboard'

let mainWindow: BrowserWindow | null
let welcomeService: WelcomeService | null

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
    welcomeService = new WelcomeService(mainWindow!)

    mainWindow.loadURL(WELCOME_WINDOW_WEBPACK_ENTRY)

    mainWindow.on('close', () => {
      console.log('Closed Welcome Window')
      events.forEach(event => {
        ipcMain.removeListener(event.channel, event.listener)
        console.log('[welcome:index.ts] Removed event', event.channel)
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
      channel: 'welcome:login',
      async listener(_: any, message: string) {
        const result = await welcomeService!.login(message)
        if (result) {
          dashboard(true)
          welcomeService!.close()
        }
      },
    },
  ]

  async function registerListeners() {
    events.forEach(event => {
      ipcMain.on(event.channel, event.listener)
      console.log('[welcome:index.ts] Registered event', event.channel)
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
