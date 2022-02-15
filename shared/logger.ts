import { BrowserWindow } from 'electron'

type LoggerConstructorArgs = {
  window: BrowserWindow
  channel: string
}

class Logger {
  private window: BrowserWindow
  private channel: string

  constructor({ window, channel }: LoggerConstructorArgs) {
    this.window = window
    this.channel = channel
  }

  log = (...log: string[]) => {
    console.log(...log)
    this.window.webContents.send(`${this.channel}:log`, log)
  }

  error = (...err: any[]) => {
    console.error(...err)
    this.window.webContents.send(`${this.channel}:error`, err)
  }
}

export default Logger
