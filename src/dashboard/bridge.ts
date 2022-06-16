import { contextBridge, ipcRenderer } from 'electron'
// Types
import {
  DashboardChannelsEnum,
  FirefoxChannelsEnum,
  GenericChannelsEnum,
  NodeChannelsEnum,
  UninstallerChannelsEnum,
} from '../@types/ipc_channels'
declare global {
  // eslint-disable-next-line
  interface Window {
    Dashboard: typeof api
  }
}

export const api = {
  launchNode: () => {
    ipcRenderer.send(NodeChannelsEnum.launch)
  },
  launchUninstaller: () => {
    ipcRenderer.send(UninstallerChannelsEnum.launch)
  },
  checkUnistaller: () => {
    ipcRenderer.send('uninstaller:checkUnistaller')
  },
  DownloadNode: () => {
    ipcRenderer.send(NodeChannelsEnum.download)
  },
  checkNode: () => {
    ipcRenderer.send('node:check')
  },
  checkSdk: () => {
    ipcRenderer.send('sdk:check')
  },
  logOut: () => {
    ipcRenderer.send(DashboardChannelsEnum.log_out)
  },
  openFirefox: () => {
    ipcRenderer.send(FirefoxChannelsEnum.launch)
  },
  DownloadFirefox: () => {
    ipcRenderer.send(FirefoxChannelsEnum.download)
  },
  getDashboardVersion: () => {
    ipcRenderer.send(DashboardChannelsEnum.get_version)
  },
  getIdentifier: () => {
    ipcRenderer.send(GenericChannelsEnum.get_identifier)
  },
  isNewDashboardReleaseAvailable: () => {
    ipcRenderer.send('dashboard:isNewDashboardReleaseAvailable')
  },
  changeFirefoxStatus: (isRunning: boolean) => {
    ipcRenderer.send(FirefoxChannelsEnum.running_status, isRunning)
  },
  nodeStop: () => {
    ipcRenderer.send(NodeChannelsEnum.stop)
  },
  checkUpdate: () => {
    ipcRenderer.send(NodeChannelsEnum.check_for_updates)
    ipcRenderer.send(FirefoxChannelsEnum.check_for_updates)
    ipcRenderer.send('sdk:checkUpdate')
  },
  getIdentity: () => {
    ipcRenderer.send(NodeChannelsEnum.get_identity)
  },
  checkBalanceAndAirdrop: () => {
    ipcRenderer.send('node:check_balance_and_airdrop')
  },
  getNodeVersion: (): string => {
    return ipcRenderer.sendSync(NodeChannelsEnum.get_version)
  },
  openDashboardDownloadLink: (url: string) => {
    ipcRenderer.send(DashboardChannelsEnum.open_download_link, url)
  },
  sendBountyRequest: () => {
    ipcRenderer.send('dashboard:bounty_request')
  },
  openFeedbackLink: () => {
    ipcRenderer.send('dashboard:open_feedback_link')
  },
  minimizeWindow: () => {
    ipcRenderer.send(GenericChannelsEnum.minimize_window)
  },
  closeWindow: () => {
    ipcRenderer.send(GenericChannelsEnum.close_window)
  },

  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_, data) => callback(data))
  },
}

contextBridge.exposeInMainWorld('Dashboard', api)
