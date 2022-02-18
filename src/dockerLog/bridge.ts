import { contextBridge, ipcRenderer } from 'electron'

declare global {
  // eslint-disable-next-line
  interface Window {
    DockerLog: typeof api
  }
}

export const api = {
  openLog: () =>{
    ipcRenderer.send('docker:openLog')
  },
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_, data) => callback(data))
  },
}

contextBridge.exposeInMainWorld('DockerLog', api)
