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
    console.log('firefox:download')
    ipcRenderer.send('firefox:download')
  },
  nodeStop: () => {
    ipcRenderer.send('node:stop')
  },
  checkUpdate: () => {
    ipcRenderer.send('node:checkUpdate')
    ipcRenderer.send('firefox:checkUpdate')
  },
  checkBalanceAndAirdrop: () => {
    ipcRenderer.send('node:check_balance_and_airdrop')
  },
  getNodeVersion: (): string => {
    return ipcRenderer.sendSync('node:getVersion');
  },

  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_, data) => callback(data))
  },
}

contextBridge.exposeInMainWorld('Dashboard', api)
