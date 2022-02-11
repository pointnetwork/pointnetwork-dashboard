import { ipcRenderer } from 'electron'

export default {
  startInstallation: () => {
    ipcRenderer.send('installer:start');
  },
}

