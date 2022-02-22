import { contextBridge, ipcRenderer } from 'electron'

declare global {
  // eslint-disable-next-line
  interface Window {
    Welcome: typeof api
  }
}

export const api = {
  generate: () => {
    ipcRenderer.send('welcome:generate')
  },
  confirm: (value: any) => {
    ipcRenderer.send('welcome:confirm', value)
  },
  login: (object: any) => {
    ipcRenderer.send('welcome:login', object)
  },
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_, data) => callback(data))
  },
}

contextBridge.exposeInMainWorld('Welcome', api)
