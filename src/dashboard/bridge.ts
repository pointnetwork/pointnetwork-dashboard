import { contextBridge, ipcRenderer } from 'electron'

declare global {
  // eslint-disable-next-line
  interface Window {
    Dashboard: typeof api
  }
}

export const api = {
  launchNode: () => {
    ipcRenderer.send('node:launch')
  },
  DownloadNode: () => {
    ipcRenderer.send('node:download')
  },
  checkNode: () => {
    ipcRenderer.send('node:check')
  },
  logOut: () => {
    ipcRenderer.send('logOut')
  },
  openFirefox: () => {
    ipcRenderer.send('firefox:launch')
  },
  DownloadFirefox: () => {
    ipcRenderer.send('firefox:download')
  },
  getDashboardVersion: () => {
    ipcRenderer.send('node:getDashboardVersion')
  },
  isNewDashboardReleaseAvailable: () => {
    ipcRenderer.send('dashboard:isNewDashboardReleaseAvailable')
  },
  changeFirefoxStatus: (isRunning: boolean) => {
    ipcRenderer.send('firefox:status', isRunning)
  },
  nodeStop: () => {
    ipcRenderer.send('node:stop')
  },
  checkUpdate: () => {
    ipcRenderer.send('node:checkUpdate')
    ipcRenderer.send('firefox:checkUpdate')
  },
  getIdentity: () => {
    ipcRenderer.send('node:getIdentity')
  },
  checkBalanceAndAirdrop: () => {
    ipcRenderer.send('node:check_balance_and_airdrop')
  },
  getNodeVersion: (): string => {
    return ipcRenderer.sendSync('node:getVersion')
  },
  openDashboardDownloadLink: (url: string) => {
    ipcRenderer.send('dashboard:openDownloadLink', url)
  },

  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_, data) => callback(data))
  },
}

contextBridge.exposeInMainWorld('Dashboard', api)
