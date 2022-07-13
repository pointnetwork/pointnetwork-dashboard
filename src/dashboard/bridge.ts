import { contextBridge, ipcRenderer } from 'electron'
// Types
import {
  BountyChannelsEnum,
  DashboardChannelsEnum,
  UninstallerChannelsEnum,
  FirefoxChannelsEnum,
  GenericChannelsEnum,
  NodeChannelsEnum,
} from './../@types/ipc_channels'

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
  checkBalance: () => ipcRenderer.send(DashboardChannelsEnum.check_balance),
  getDashboardVersion: () =>
    new Promise<string>(resolve => {
      ipcRenderer.once(DashboardChannelsEnum.get_version, (_, v: string) => {
        resolve(v)
      })
      ipcRenderer.send(DashboardChannelsEnum.get_version)
    }),
  logOut: () => ipcRenderer.send(DashboardChannelsEnum.log_out),
  // Node
  getIdentityInfo: () => ipcRenderer.send(NodeChannelsEnum.get_identity),
  launchNode: () => ipcRenderer.send(NodeChannelsEnum.launch),
  getNodeVersion: () => new Promise<string>((resolve) => {
    ipcRenderer.once(NodeChannelsEnum.get_version, (_, v: string) => {
      resolve(v)
    })
    ipcRenderer.send(NodeChannelsEnum.get_version)
  }),
  // Uninstaller
  launchUninstaller: () => ipcRenderer.send(UninstallerChannelsEnum.launch),
  // Firefox
  getFirefoxVersion: () =>
    new Promise<string>(resolve => {
      ipcRenderer.once(FirefoxChannelsEnum.get_version, (_, v: string) => {
        resolve(v)
      })
      ipcRenderer.send(FirefoxChannelsEnum.get_version)
    }),
  launchBrowser: () => ipcRenderer.send(FirefoxChannelsEnum.launch),
  // Generic
  copyToClipboard: (message: string) =>
    ipcRenderer.send(GenericChannelsEnum.copy_to_clipboard, message),
  openExternalLink: (link: string) =>
    ipcRenderer.send(GenericChannelsEnum.open_external_link, link),
  getIndentifier: () => new Promise<string>((resolve) => {
    ipcRenderer.once(GenericChannelsEnum.get_identifier, (_, id: string) => {
      resolve(id)
    })
    ipcRenderer.send(GenericChannelsEnum.get_identifier)
  }),
  checkForUpdates: () => {
    ipcRenderer.send(GenericChannelsEnum.check_for_updates)
  },
  minimizeWindow: () => ipcRenderer.send(GenericChannelsEnum.minimize_window),
  closeWindow: () => ipcRenderer.send(GenericChannelsEnum.close_window),

  on: (channel: string, callback: Function) =>
    ipcRenderer.on(channel, (_, data) => callback(data)),
}

contextBridge.exposeInMainWorld('Dashboard', api)
