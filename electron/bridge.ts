import { contextBridge, ipcRenderer } from 'electron'

export const api = {
  /**
   * Here you can expose functions to the renderer process
   * so they can interact with the main (electron) side
   * without security problems.
   *
   * The function below can accessed using `window.Main.sendMessage`
   */

  send: (channel: string, message: string) => {
    console.log('enra aqui')
    ipcRenderer.send(channel, message)
  },

  /**
   * Provide an easier way to listen to events
   */
  once: (channel: string, callback: Function) => {
    ipcRenderer.once(channel, (_, data) => callback(data))
  }
}

contextBridge.exposeInMainWorld('Main', api)
