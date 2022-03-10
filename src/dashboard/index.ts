import { app, BrowserWindow, ipcMain } from 'electron'
import Firefox from '../firefox'
import Node from '../node'
import helpers from '../../shared/helpers'
import axios from 'axios'

let mainWindow: BrowserWindow | null

let node: Node | null
let firefox: Firefox | null

declare const DASHBOARD_WINDOW_PRELOAD_WEBPACK_ENTRY: string
declare const DASHBOARD_WINDOW_WEBPACK_ENTRY: string

// const assetsPath =
//   process.env.NODE_ENV === 'production'
//     ? process.resourcesPath
//     : app.getAppPath()

export default function (isExplicitRun = false) {
  async function createWindow() {
    mainWindow = new BrowserWindow({
      // icon: path.join(assetsPath, 'assets', 'icon.png'),
      width: 860,
      height: 500,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: DASHBOARD_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    })

    node = new Node(mainWindow!)
    // if (!(await node.pointNodeCheck())) node.launch()

    firefox = new Firefox(mainWindow!)
    // debug
    // mainWindow.webContents.openDevTools()

    mainWindow.loadURL(DASHBOARD_WINDOW_WEBPACK_ENTRY)

    mainWindow.on('close', async () => {
      console.log('Closed Dashboard Window')
      events.forEach(event => {
        ipcMain.removeListener(event.channel, event.listener)
        console.log('[dashboard:index.ts] Removed event', event.channel)
      })
      await node?.stopNode()
    })

    mainWindow.on('closed', () => {
      node = null
      firefox = null
      mainWindow = null
    })
  }

  const events = [
    {
      channel: 'firefox:launch',
      listener() {
        firefox!.launch()
      },
    },
    {
      channel: 'node:launch',
      listener() {
        node!.launch()
      },
    },
    {
      channel: 'node:check',
      listener() {
        node!.pointNodeCheck()
      },
    },
    {
      channel: 'logOut',
      async listener() {
        await node!.stopNode()
        helpers.logout()
        mainWindow!.close()
      },
    },
    {
      channel: 'node:stop',
      async listener() {
        await node!.stopNode()
      },
    },
    {
      channel: 'node:check_balance_and_airdrop',
      async listener() {
        try {
          console.log('[node:check_balance_and_airdrop] Getting wallet address')
          let res = await axios.get(
            'http://localhost:2468/v1/api/wallet/address'
          )
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
      },
    },
  ]

  async function registerListeners() {
    events.forEach(event => {
      ipcMain.on(event.channel, event.listener)
      console.log('[dashboard:index.ts] Registered event', event.channel)
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
