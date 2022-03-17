import { BrowserWindow } from 'electron';
import helpers from './helpers';
import path from 'path';
import logger from 'electron-log';
import { createUdpLogTransport } from './udpLogTransport';
import { getIdentifier } from './getIdentifier';

export const DEFAULT_LEVEL = 'info';
const pointPath = helpers.getPointPath()
const address = 'logstash.pointspace.io'
const port = 12201
const identifier = getIdentifier();

logger.transports.udp = createUdpLogTransport(address, port, DEFAULT_LEVEL, {identifier});
logger.transports.console.level = DEFAULT_LEVEL;
logger.transports.file.level = DEFAULT_LEVEL;
logger.transports.file.resolvePath = () => path.join(pointPath, 'pointdashboard.log');

interface LoggerConstructorArgs {
  window: BrowserWindow;
  channel: string;
  module: string;
}

const defaultOptions: Partial<LoggerConstructorArgs> = {};

export default class Logger {
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
