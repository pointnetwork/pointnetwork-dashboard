import { contextBridge, ipcRenderer } from 'electron'
import installerBridge from '../installer/bridge';

export const api = {
  /**
   * Here you can expose functions to the renderer process
   * so they can interact with the main (electron) side
   * without security problems.
   *
   * The function below can accessed using `window.Main.hello`
   */
  hello: () => {
    ipcRenderer.send('hello');
  },
  /**
   * Provide an easier way to listen to events
   */
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_, data) => callback(data))
  },
  ...installerBridge,
}

contextBridge.exposeInMainWorld('Main', api)
