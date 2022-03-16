import { BrowserWindow } from 'electron';
import helpers from './helpers';
import path from 'path';
import logger from 'electron-log';

const homePath = helpers.getHomePath()
const DEFAULT_LEVEL = 'info';
logger.transports.console.level = DEFAULT_LEVEL;
logger.transports.file.level = DEFAULT_LEVEL;
logger.transports.file.resolvePath = () => path.join(homePath, '.point', 'pointdashboard.log');

type LoggerConstructorArgs = {
  window: BrowserWindow
  channel: string
}

const defaultOptions: Partial<LoggerConstructorArgs> = {};

class Logger {
  private window?: BrowserWindow
  private channel?: string

  constructor({ window, channel } = defaultOptions) {
    this.window = window
    this.channel = channel
  }

  info = (...log: string[]) => {
    logger.info(...log)
    this.window?.webContents.send(`${this.channel}:log`, log)
  }

  error = (...err: any[]) => {
    logger.error(...err)
    this.window?.webContents.send(`${this.channel}:error`, err)
  }
}

export default Logger
