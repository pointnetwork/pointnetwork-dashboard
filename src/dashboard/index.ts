import { UpdateLog } from './../@types/generic'
import { app, BrowserWindow, ipcMain, shell, clipboard } from 'electron'
import axios from 'axios'
import Bounty from '../bounty'
import Firefox from '../firefox'
import Node from '../node'
import PointSDK from '../pointsdk'
import Uninstaller from '../uninstaller'
import Logger from '../../shared/logger'
import helpers from '../../shared/helpers'
import welcome from '../welcome'
import { getIdentifier } from '../../shared/getIdentifier'
import baseWindowConfig from '../../shared/windowConfig'
// Types
import {
  BountyChannelsEnum,
  DashboardChannelsEnum,
  FirefoxChannelsEnum,
  GenericChannelsEnum,
  NodeChannelsEnum,
  UninstallerChannelsEnum,
} from '../@types/ipc_channels'
import { EventListener } from '../@types/generic'
import { ErrorsEnum } from '../@types/errors'

let window: BrowserWindow | null
let node: Node | null
let firefox: Firefox | null
let pointSDK: PointSDK | null
let uninstaller: Uninstaller | null

declare const DASHBOARD_WINDOW_PRELOAD_WEBPACK_ENTRY: string
declare const DASHBOARD_WINDOW_WEBPACK_ENTRY: string

const logger = new Logger({ module: 'dashboard_window' })

/**
 * Useful where we want to do some cleanup before closing the window
 */
const shutdownResources = async () => {
  logger.info('Removing all event listeners')
  ipcMain.removeAllListeners()
  logger.info('Removed all event listeners')

  try {
    await node?.stop()
    await firefox?.stop()
  } catch (error) {
    logger.error(ErrorsEnum.DASHBOARD_ERROR, error)
  }
}

export default function (isExplicitRun = false) {
  async function createWindow() {
    window = new BrowserWindow({
      ...baseWindowConfig,
      width: 860,
      height: 560,
      webPreferences: {
        ...baseWindowConfig.webPreferences,
        preload: DASHBOARD_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
    })

    window.loadURL(DASHBOARD_WINDOW_WEBPACK_ENTRY)

    firefox = new Firefox({ window })
    node = new Node({ window })
    pointSDK = new PointSDK({ window })
    uninstaller = new Uninstaller({ window })

    window.on('close', async ev => {
      ev.preventDefault()
      await shutdownResources()
      window?.destroy()
    })

    window.on('closed', () => {
      node = null
      firefox = null
      window = null
    })
  }

  const events: EventListener[] = [
    // Bounty channels
    {
      channel: BountyChannelsEnum.send_generated,
      listener() {
        try {
          new Bounty({ window: window! }).sendGenerated()
        } catch (error) {
          logger.error(ErrorsEnum.DASHBOARD_ERROR, error)
        }
      },
    },
    // Dashboard channels
    {
      channel: DashboardChannelsEnum.log_out,
      async listener() {
        try {
          window?.webContents.send(DashboardChannelsEnum.log_out)
          await shutdownResources()
          helpers.logout()
          welcome(true)
          window?.destroy()
        } catch (error) {
          logger.error(ErrorsEnum.DASHBOARD_ERROR, error)
        }
      },
    },
    {
      channel: DashboardChannelsEnum.get_version,
      async listener() {
        try {
          window?.webContents.send(
            DashboardChannelsEnum.get_version,
            helpers.getInstalledDashboardVersion()
          )
        } catch (error) {
          logger.error(ErrorsEnum.DASHBOARD_ERROR, error)
        }
      },
    },
    {
      channel: DashboardChannelsEnum.check_balance_and_airdrop,
      async listener() {
        // TODO: move this func somewhere to utils
        const delay = (ms: number) =>
          new Promise(resolve => {
            setTimeout(resolve, ms)
          })
        const start = new Date().getTime()
        try {
          let balance = 0
          logger.info('Getting wallet address')
          const addressRes = await axios.get(
            'http://localhost:2468/v1/api/wallet/address'
          )
          const address = addressRes.data.data.address

          const requestAirdrop = async () => {
            const faucetURL = helpers.getFaucetURL()
            logger.info('Airdropping wallet address with POINTS')
            try {
              await axios.get(`${faucetURL}/airdrop?address=${address}`)
            } catch (error) {
              logger.error(ErrorsEnum.DASHBOARD_ERROR, error)
            }
          }

          const checkBalance = async () => {
            const faucetURL = helpers.getFaucetURL()
            logger.info(`Getting wallet balance for address: ${address}`)
            try {
              const res = await axios.get(
                `${faucetURL}/balance?address=${address}`
              )
              if (res.data?.balance && !isNaN(res.data.balance)) {
                logger.info(`Balance: ${res.data.balance}`)
                balance = res.data.balance
              } else {
                logger.error(`Unexpected balance response: ${res.data}`)
              }
            } catch (error) {
              logger.error(ErrorsEnum.DASHBOARD_ERROR, error)
            }
          }

          await checkBalance()

          window?.webContents.send(
            DashboardChannelsEnum.check_balance_and_airdrop,
            balance
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

          window?.webContents.send(
            DashboardChannelsEnum.check_balance_and_airdrop,
            balance
          )
        } catch (error) {
          logger.error(ErrorsEnum.DASHBOARD_ERROR, error)
        }
      },
    },
    // Uninstaller channels
    {
      channel: UninstallerChannelsEnum.launch,
      async listener() {
        try {
          await uninstaller?.launch()
        } catch (error) {
          logger.error(ErrorsEnum.DASHBOARD_ERROR, error)
        }
      },
    },
    // Firefox channels
    {
      channel: FirefoxChannelsEnum.launch,
      async listener() {
        try {
          await firefox?.launch()
        } catch (error) {
          logger.error(ErrorsEnum.DASHBOARD_ERROR, error)
        }
      },
    },
    {
      channel: FirefoxChannelsEnum.get_version,
      listener() {
        window?.webContents.send(
          FirefoxChannelsEnum.get_version,
          helpers.getInstalledVersionInfo('firefox').installedReleaseVersion
        )
      },
    },
    // Node channels
    {
      channel: NodeChannelsEnum.launch,
      async listener() {
        try {
          await node?.launch()
          setTimeout(() => node?.ping(), 3000)
        } catch (error) {
          logger.error(ErrorsEnum.DASHBOARD_ERROR, error)
        }
      },
    },
    {
      channel: NodeChannelsEnum.get_identity,
      async listener() {
        try {
          await node?.getIdentityInfo()
        } catch (error) {
          logger.error(ErrorsEnum.DASHBOARD_ERROR, error)
        }
      },
    },
    {
      channel: NodeChannelsEnum.running_status,
      async listener() {
        try {
          await node?.ping()
        } catch (error) {
          logger.error(ErrorsEnum.DASHBOARD_ERROR, error)
        }
      },
    },
    {
      channel: NodeChannelsEnum.get_version,
      listener() {
        window?.webContents.send(
          NodeChannelsEnum.get_version,
          helpers.getInstalledVersionInfo('node').installedReleaseVersion
        )
      },
    },
    // Generic channels
    {
      channel: GenericChannelsEnum.get_identifier,
      listener() {
        window?.webContents.send(
          GenericChannelsEnum.get_identifier,
          getIdentifier()[0]
        )
      },
    },
    {
      channel: GenericChannelsEnum.copy_to_clipboard,
      // @ts-ignore
      listener(_, message: string) {
        clipboard.writeText(message)
        window?.webContents.send(GenericChannelsEnum.copy_to_clipboard)
      },
    },
    {
      channel: GenericChannelsEnum.open_external_link,
      // @ts-ignore
      listener(_, link: string) {
        try {
          shell.openExternal(link)
        } catch (error) {
          logger.error(ErrorsEnum.DASHBOARD_ERROR, error)
        }
      },
    },
    {
      channel: GenericChannelsEnum.check_for_updates,
      async listener() {
        try {
          // TODO: Check for SDK, dashboard, and installer updates too
          await node?.checkForUpdates()
          await firefox?.checkForUpdates()
          await pointSDK?.checkForUpdates()

          const latestDashboardV = await helpers.getLatestReleaseFromGithub(
            'pointnetwork-dashboard'
          )
          const installedDashboardV =
            await helpers.getInstalledDashboardVersion()

          if (latestDashboardV !== `v${installedDashboardV}`)
            window?.webContents.send(
              DashboardChannelsEnum.check_for_updates,
              JSON.stringify({
                isAvailable: true,
                isChecking: false,
              } as UpdateLog)
            )
        } catch (error) {
          logger.error(ErrorsEnum.DASHBOARD_ERROR, error)
        }
      },
    },
    {
      channel: GenericChannelsEnum.close_window,
      async listener() {
        window?.webContents.send(DashboardChannelsEnum.closing)
        window?.close()
      },
    },
    {
      channel: GenericChannelsEnum.minimize_window,
      listener() {
        window?.minimize()
      },
    },
  ]

  async function registerListeners() {
    events.forEach(event => {
      ipcMain.on(event.channel, event.listener)
      logger.info('Registered event', event.channel)
    })
  }

  if (isExplicitRun) {
    createWindow()
    registerListeners()
  }

  app.on('will-quit', async function () {
    // This is a good place to add tests insuring the app is still
    // responsive and all windows are closed.
    logger.info('Dashboard Window "will-quit" event')
  })

  if (!isExplicitRun) {
    app
      .on('ready', createWindow)
      .whenReady()
      .then(registerListeners)
      .catch(e => logger.error(e))

    app.on('window-all-closed', () => {
      app.quit()
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  }
}
