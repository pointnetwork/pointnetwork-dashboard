import { createSocket, Socket } from 'dgram'
import { LevelOption } from 'electron-log'
import { Writable } from 'stream'
import { hostname } from 'os'
import helpers from './helpers'

const hostName = hostname()
const pid = process.pid

type UdpLogTransport = {
  level: LevelOption
  (message: any): void
}

const logLevels: Record<string, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
}

function getLogLevel(level: string): number {
  return logLevels[level] || logLevels.info
}

function createUdpStream(options: { address: string; port: number }) {
  const socket: Socket = createSocket('udp4')
  return new Writable({
    final: () => socket.close(),
    write: (data, _encoding, done) => {
      socket.send(data, 0, data.length, options.port, options.address, done)
    },
  })
}

export function createUdpLogTransport(
  address: string,
  port: number,
  level: LevelOption,
  additionalTags: Record<string, string | number>
) {
  const udpStream = createUdpStream({ address, port })
  const udpLogTransport: UdpLogTransport = (message: any) => {
    const payload = {
      level: getLogLevel(message.level),
      time: message.date.getTime(),
      pid,
      hostname: hostName,
      msg: message.data.join(' '),
      ...additionalTags,
    }
    udpStream.write(Buffer.from(JSON.stringify(payload)), helpers.noop)
  }
  udpLogTransport.level = level
  ;(udpLogTransport as any).__udpStream = udpStream
  return udpLogTransport
}
