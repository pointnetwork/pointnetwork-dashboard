import {
  BountyChannelsEnum,
  DashboardChannelsEnum,
} from './../@types/ipc_channels'
import { contextBridge, ipcRenderer } from 'electron'
// Types
import {
  FirefoxChannelsEnum,
  GenericChannelsEnum,
  NodeChannelsEnum,
} from '../@types/ipc_channels'

declare global {
  // eslint-disable-next-line
  interface Window {
    Dashboard: typeof api
  }
}

export const api = {
  // Bounty
  sendGeneratedEventToBounty: () =>
    ipcRenderer.send(BountyChannelsEnum.send_generated),
  // Dashboard
  checkBalanceAndAirdrop: () =>
    ipcRenderer.send(DashboardChannelsEnum.check_balance_and_airdrop),
  getDashboardVersion: () =>
    ipcRenderer.send(DashboardChannelsEnum.get_version),
  logOut: () => ipcRenderer.send(DashboardChannelsEnum.log_out),
  // Node
  getIdentityInfo: () => ipcRenderer.send(NodeChannelsEnum.get_identity),
  pingNode: () => ipcRenderer.send(NodeChannelsEnum.running_status),
  launchNodeAndPing: () => ipcRenderer.send(NodeChannelsEnum.launch),
  getNodeVersion: () => ipcRenderer.send(NodeChannelsEnum.get_version),
  // Firefox
  getFirefoxVersion: () => ipcRenderer.send(FirefoxChannelsEnum.get_version),
  launchBrowser: () => ipcRenderer.send(FirefoxChannelsEnum.launch),
  // Generic
  getIndentifier: () => ipcRenderer.send(GenericChannelsEnum.get_identifier),
  checkForUpdates: () =>
    ipcRenderer.send(GenericChannelsEnum.check_for_updates),
  minimizeWindow: () => ipcRenderer.send(GenericChannelsEnum.minimize_window),
  closeWindow: () => ipcRenderer.send(GenericChannelsEnum.close_window),

  on: (channel: string, callback: Function) =>
    ipcRenderer.on(channel, (_, data) => callback(data)),
}

contextBridge.exposeInMainWorld('Dashboard', api)

// launchUninstaller: () => {
//   ipcRenderer.send(UninstallerChannelsEnum.launch)
// },

// openFeedbackLink: () => {
//   ipcRenderer.send('dashboard:open_feedback_link')
// },
