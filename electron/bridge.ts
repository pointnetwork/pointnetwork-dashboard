import { contextBridge, ipcRenderer } from 'electron'

export const api = {
  /**
   * Here you can expose functions to the renderer process
   * so they can interact with the main (electron) side
   * without security problems.
   *
   * The function below can accessed using `window.Main.sendMessage`
   */

  send: (channel: string, message?: string) => {
    ipcRenderer.send(channel, message)
  },

  /**
   * Provide an easier way to listen to events
     */
  receive: (channel: string, func: (arg0: any[]) => void) => ipcRenderer.once(
    channel,
    (event, ...args) => func(args)
  )

}

contextBridge.exposeInMainWorld("Main",api)
