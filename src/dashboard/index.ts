import { app, BrowserWindow, ipcMain, dialog, IpcMainEvent } from 'electron'
import Firefox from '../firefox'
import Node from '../node'
import helpers from '../../shared/helpers'
import baseWindowConfig from '../../shared/windowConfig'
import axios from 'axios'

let mainWindow: BrowserWindow | null

let node: Node | null
let firefox: Firefox | null

let isFirefoxRunning = false
let isLoggingOut = false

declare const DASHBOARD_WINDOW_PRELOAD_WEBPACK_ENTRY: string
declare const DASHBOARD_WINDOW_WEBPACK_ENTRY: string

const MESSAGES = {
  closeConfirmation: {
    title: 'Are you sure you want to close?',
    message:
      'Closing the Dashboard will also close the Browser. Are you sure you want to close them?',
    buttons: {
      confirm: 'Yes',
      cancel: 'No',
    },
  },
  logoutConfirmation: {
    title: 'Are you sure you want to log out?',
    message:
      'Do you want to close the browser and remove the secret phrase from this computer?',
    buttons: {
      confirm: 'Yes',
      cancel: 'No',
    },
  },
}

// const assetsPath =
//   process.env.NODE_ENV === 'production'
//     ? process.resourcesPath
//     : app.getAppPath()

export default function (isExplicitRun = false) {
  async function createWindow() {
    mainWindow = new BrowserWindow({
      ...baseWindowConfig,
      width: 860,
      height: 560,
      webPreferences: {
        ...baseWindowConfig.webPreferences,
        preload: DASHBOARD_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    })

    isLoggingOut = false

    node = new Node(mainWindow!)
    // if (!(await node.pointNodeCheck())) node.launch()

    firefox = new Firefox(mainWindow!)
    // debug
    // mainWindow.webContents.openDevTools()

    mainWindow.loadURL(DASHBOARD_WINDOW_WEBPACK_ENTRY)

    mainWindow.on('close', async ev => {
      let quit = true

      if (!isLoggingOut && isFirefoxRunning) {
        const confirmationAnswer = dialog.showMessageBoxSync({
          type: 'question',
          title: MESSAGES.closeConfirmation.title,
          message: MESSAGES.closeConfirmation.message,
          buttons: [
            MESSAGES.closeConfirmation.buttons.confirm,
            MESSAGES.closeConfirmation.buttons.cancel,
          ],
        })

        if (confirmationAnswer === 1) {
          // User clicked 'No' (button at index 1)
          quit = false
        }
      }

      if (quit) {
        console.log('Closed Dashboard Window')
        events.forEach(event => {
          ipcMain.removeListener(event.channel, event.listener)
          console.log('[dashboard:index.ts] Removed event', event.channel)
        })
        await Promise.all([firefox?.close(), node?.stopNode()])
      } else {
        ev.preventDefault()
      }
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
      channel: 'firefox:status',
      listener(_ev: IpcMainEvent, isRunning: boolean) {
        isFirefoxRunning = isRunning
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
      channel: 'node:download',
      listener() {
        node!.download()
      },
    },
    {
      channel: 'node:checkUpdate',
      listener() {
        node!.checkNodeVersion()
      },
    },
    {
      channel: 'logOut',
      async listener() {
        const confirmationAnswer = dialog.showMessageBoxSync({
          type: 'question',
          title: MESSAGES.logoutConfirmation.title,
          message: MESSAGES.logoutConfirmation.message,
          buttons: [
            MESSAGES.logoutConfirmation.buttons.confirm,
            MESSAGES.logoutConfirmation.buttons.cancel,
          ],
        })

        if (confirmationAnswer === 0) {
          // User clicked 'Yes' (button at index 0)
          isLoggingOut = true
          await node!.stopNode()
          helpers.logout()
          mainWindow!.close()
        }
      },
    },
    {
      channel: 'node:stop',
      async listener() {
        await node!.stopNode()
      },
    },
    {
      channel: 'node:getVersion',
      async listener(event: IpcMainEvent) {
        event.returnValue = await helpers.getInstalledVersion()
      },
    },
    {
      channel: 'node:check_balance_and_airdrop',
      async listener() {
        // TODO: move this func somewhere to utils
        const delay = (ms: number) =>
          new Promise(resolve => {
            setTimeout(resolve, ms)
          })
        const start = new Date().getTime()
        try {
          let balance = 0
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

          mainWindow!.webContents.send(
            'node:wallet_info',
            JSON.stringify({ balance, address })
          )
          // eslint-disable-next-line no-unmodified-loop-condition
          while (balance <= 0) {
            if (new Date().getTime() - start > 120000) {
              throw new Error(
                'Could not get positive wallet balance in 2 minutes'
              )
            }
            await requestAirdrop()
            await delay(10000)
            await checkBalance()
          }

          mainWindow!.webContents.send(
            'node:wallet_info',
            JSON.stringify({ balance, address })
          )
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
