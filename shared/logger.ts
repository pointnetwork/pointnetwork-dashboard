import { BrowserWindow } from 'electron'
import helpers from './helpers'
import path from 'path'
import logger from 'electron-log'
import { createUdpLogTransport } from './udpLogTransport'
import { getIdentifier } from './getIdentifier'
import * as os from 'node:os'

const platform = os.platform()
const arch = os.arch()
const release = os.release()
const version = os.version()

export const DEFAULT_LEVEL = 'info'
const pointPath = helpers.getPointPath()
const address = 'logstash.pointspace.io'
const port = 12201
const [identifier, isNewIdentifier] = getIdentifier()

logger.transports.udp = createUdpLogTransport(address, port, DEFAULT_LEVEL, {
  identifier,
})
logger.transports.console.level = DEFAULT_LEVEL
logger.transports.file.level = DEFAULT_LEVEL
logger.transports.file.resolvePath = () =>
  path.join(pointPath, 'pointdashboard.log')

interface LoggerConstructorArgs {
  window: BrowserWindow
  channel: string
  module: string
}

const defaultOptions: Partial<LoggerConstructorArgs> = {}

;(logger.transports.udp as any).__udpStream.write(
  Buffer.from(JSON.stringify({ identifier, isNewIdentifier })),
  helpers.noop
)

export default class Logger {
  private window?: BrowserWindow
  private channel?: string

  constructor({ window, channel } = defaultOptions) {
    this.window = window
    this.channel = channel
  }

  info = (...log: string[]) => {
    logger.info(
      ...log,
      `>> SYSTEM_INFO: platform:${platform}, arch:${arch}, release:${release}, version:${version}`
    )
    this.window?.webContents.send(`${this.channel}:log`, log)
  }

  error = (...err: any[]) => {
    logger.error(
      ...err,
      `>> SYSTEM_INFO: platform:${platform}, arch:${arch}, release:${release}, version:${version}`
    )
    this.window?.webContents.send(`${this.channel}:error`, err)
  }

  sendMetric = (payload: Record<string, string | number | boolean>) => {
    ;(logger.transports.udp as any).__udpStream.write(
      Buffer.from(JSON.stringify({ identifier, ...payload })),
      helpers.noop
    )
  }
}
