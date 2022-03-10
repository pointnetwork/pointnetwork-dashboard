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
    if (!(await node.pointNodeCheck())) node.launch()

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
      listener() {
        mainWindow!.close()
        helpers.logout()
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
        // TODO: move this func somewhere to utils
        const delay = (ms: number) => new Promise(resolve => {setTimeout(resolve, ms)})
        try {
          let balance = 0
          let failed = false
          setTimeout(() => {
            failed = true
            console.error('Could not get positive wallet balance in 2 minutes')
          }, 120000)
          console.log('[node:check_balance_and_airdrop] Getting wallet address')
          const addressRes = await axios.get(
            'http://localhost:2468/v1/api/wallet/address'
          )
          const address = addressRes.data.data.address

          const requestAirdrop = async () => {
            console.log(
              '[node:check_balance_and_airdrop] Airdropping wallet address with yPoints'
            )
            try {
              await axios.get(
                `https://point-faucet.herokuapp.com/airdrop?address=${address}`
              )
            } catch (e) {
              console.error(e)
            }
          }

          const checkBalance = async () => {
            console.log(
              `[node:check_balance_and_airdrop] Getting wallet balance for address: ${address}`
            )
            try {
              const res = await axios.get(
                `https://point-faucet.herokuapp.com/balance?address=${address}`
              )
              if (res.data?.balance && !isNaN(res.data.balance)) {
                console.log(
                  `[node:check_balance_and_airdrop] Balance: ${res.data.balance}`
                )
                balance = res.data.balance
              } else {
                console.error(`Unexpected balance response: ${res.data}`)
              }
            } catch (e) {
              console.error(e)
            }
          }

          await checkBalance()
          // eslint-disable-next-line no-unmodified-loop-condition
          while (balance <= 0 && !failed) {
            await requestAirdrop()
            await delay(10000)
            await checkBalance()
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
