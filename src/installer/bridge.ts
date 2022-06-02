import { contextBridge, ipcRenderer } from 'electron'

declare global {
  // eslint-disable-next-line
  interface Window {
    Installer: typeof api
  }
}

export const api = {
  startInstallation: () => {
    ipcRenderer.send('installer:start')
  },
  getDashboardVersion: () => {
    ipcRenderer.send('installer:getDashboardVersion')
  },
  minimizeWindow: () => {
    ipcRenderer.send(`installer:minimizeWindow`)
  },
  closeWindow: () => {
    ipcRenderer.send(`installer:closeWindow`)
  },

  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_, data) => callback(data))
  },
}

contextBridge.exposeInMainWorld('Installer', api)
