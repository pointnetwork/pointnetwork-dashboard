import { contextBridge, ipcRenderer } from 'electron'

declare global {
  // eslint-disable-next-line
  interface Window {
    Dashboard: typeof api
  }
}

export const api = {
  checkFirefox: () => {
    ipcRenderer.send('firefox:check')
  },
  launchNode: () => {
    ipcRenderer.send('node:launch')
  },
  checkNode: () => {
    ipcRenderer.send('node:check')
  },
  logOut: () => {
    ipcRenderer.send('logOut')
  },
  createLogWindow: () => {
    ipcRenderer.send('node:window')
  },
  openFirefox: () => {
    ipcRenderer.send('firefox:launch')
  },
  nodeStop: () => {
    ipcRenderer.send('node:stop')
  },
  checkBalanceAndAirdrop: () => {
    ipcRenderer.send('node:check_balance_and_airdrop')
  },

  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_, data) => callback(data))
  },
}

contextBridge.exposeInMainWorld('Dashboard', api)
