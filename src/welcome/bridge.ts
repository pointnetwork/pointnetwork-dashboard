import { contextBridge, ipcRenderer } from 'electron'

declare global {
  // eslint-disable-next-line
  interface Window {
    Welcome: typeof api
  }
}

export const api = {
  generateMnemonic: () => {
    ipcRenderer.send('welcome:generate_mnemonic')
  },
  validateMnemonic: (value: any) => {
    ipcRenderer.send('welcome:validate_mnemonic', value)
  },
  login: (object: any) => {
    ipcRenderer.send('welcome:login', object)
  },
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_, data) => callback(data))
  },
  copyMnemonic: (value: any) => {
    ipcRenderer.send('welcome:copy_mnemonic', value)
  },
  getDictionary: () => {
    ipcRenderer.send('welcome:get_dictionary')
  },
}

contextBridge.exposeInMainWorld('Welcome', api)
