import { contextBridge, ipcRenderer } from 'electron'
import {
  DashboardChannelsEnum,
  GenericChannelsEnum,
} from '../@types/ipc_channels'
import { InstallerChannelsEnum } from './../@types/ipc_channels'

declare global {
  // eslint-disable-next-line
  interface Window {
    Installer: typeof api
  }
}

export const api = {
  startInstallation: () => {
    ipcRenderer.send(InstallerChannelsEnum.start)
  },
  getDashboardVersion: () => {
    ipcRenderer.send(DashboardChannelsEnum.get_version)
  },
  getIdentifier: () => {
    ipcRenderer.send(GenericChannelsEnum.get_identifier)
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

contextBridge.exposeInMainWorld('Installer', api)
