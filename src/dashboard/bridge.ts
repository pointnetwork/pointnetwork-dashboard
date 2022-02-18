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
  checkDocker: () => {
    ipcRenderer.send('docker:check')
  },
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_, data) => callback(data))
  },
}

contextBridge.exposeInMainWorld('Dashboard', api)
