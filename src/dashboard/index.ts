import { app, BrowserWindow, ipcMain } from 'electron'
import Firefox from '../firefox'
import Node from '../node'
import helpers from '../../shared/helpers'
import axios from 'axios'

let mainWindow: BrowserWindow | null

let node: Node

declare const DASHBOARD_WINDOW_PRELOAD_WEBPACK_ENTRY: string
declare const DASHBOARD_WINDOW_WEBPACK_ENTRY: string

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
    node = new Node(mainWindow!)
    // debug
    // mainWindow.webContents.openDevTools()

    mainWindow.loadURL(DASHBOARD_WINDOW_WEBPACK_ENTRY)

    mainWindow.on('closed', () => {
      console.log('Closed Dashboard Window')
      mainWindow = null
    })
  }

  async function registerListeners() {
    const firefox = new Firefox(mainWindow!)

    ipcMain.on('firefox:launch', async (_, message) => {
      await firefox.launch()
    })

    ipcMain.on('node:launch', async (_, message) => {
      node.launch()
    })

    ipcMain.on('node:check', async (_, message) => {
      await node.pointNodeCheck()
    })

    ipcMain.on('logOut', async (_, message) => {
      mainWindow!.close()
      helpers.logout()
    })

    ipcMain.on('node:stop', async (_, message) => {
      node.stopNode()
    })

    ipcMain.on('node:check_balance_and_airdrop', async () => {
      try {
        console.log('[node:check_balance_and_airdrop] Getting wallet address')
        let res = await axios.get('http://localhost:2468/v1/api/wallet/address')
        const address = res.data.data.address
        console.log(
          `[node:check_balance_and_airdrop] Getting wallet balance for address: ${address}`
        )
        res = await axios.get(
          `https://point-faucet.herokuapp.com/balance?address=${address}`
        )
        if (res.data.balance <= 0) {
          console.log(
            '[node:check_balance_and_airdrop] Airdropping wallet address with yPoints'
          )
          await axios.get(
            `https://point-faucet.herokuapp.com/airdrop?address=${address}`
          )
        }
      } catch (error) {
        console.error(error)
      }
    })
  }

  if (isExplicitRun) {
    createWindow()
    registerListeners()
  }

  app.on('will-quit', async function () {
    // This is a good place to add tests insuring the app is still
    // responsive and all windows are closed.
    console.log('Dashboard Window "will-quit" event')
    await node.stopNode()
  })

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
