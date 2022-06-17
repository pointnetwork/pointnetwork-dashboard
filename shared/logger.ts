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

const SYSTEM_INFO = `>> SYSTEM_INFO: platform:${platform}, arch:${arch}, release:${release}, version:${version}`

export default class Logger {
  private window?: BrowserWindow
  // TODO: Remove the channel from here and default to use sendToChannel method instead
  private channel?: string
  // TODO: Make module a required thing
  private module?: string

  constructor({ window, channel, module } = defaultOptions) {
    this.window = window
    this.channel = channel
    this.module = module
  }

  info = (...log: string[]) => {
    logger.info(`[${this.module}]`, ...log, SYSTEM_INFO)
    // TODO: Remove
    this.window?.webContents.send(`${this.channel}:log`, log)
  }

  error = (...err: any[]) => {
    logger.error(`[${this.module}]`, ...err, SYSTEM_INFO)
    // TODO: Remove
    this.window?.webContents.send(`${this.channel}:error`, err)
  }

  sendToChannel = ({ channel, log }: { channel: string; log: string }) => {
    logger.info(`[${this.module}]`, `[${channel}]`, log, SYSTEM_INFO)
    this.window?.webContents.send(channel, log)
  }

  sendMetric = (payload: Record<string, string | number | boolean>) => {
    ;(logger.transports.udp as any).__udpStream.write(
      Buffer.from(JSON.stringify({ identifier, ...payload })),
      helpers.noop
    )
  }
}
