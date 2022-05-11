import { contextBridge, ipcRenderer } from 'electron'

const getTopbarAbi = (channel: string) => {
  const topbarApi = {
    minimizeWindow: () => {
      ipcRenderer.send(`${channel}:minimizeWindow`)
    },
    closeWindow: () => {
      ipcRenderer.send(`${channel}:closeWindow`)
    },
  }

  contextBridge.exposeInMainWorld('TopBar', topbarApi)
}

export default getTopbarAbi
