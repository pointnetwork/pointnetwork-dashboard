 import {createSocket, Socket} from 'dgram';
import {LevelOption} from 'electron-log';
import {Writable} from 'stream';
import {hostname} from 'os';
import helpers from './helpers';

const hostName = hostname();
const pid = process.pid;

type UdpLogTransport = {
    level: LevelOption
    __udpStream: Writable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (message: Record<string, any>): void
}

const logLevels: Record<string, number> = {
    trace: 10,
    debug: 20,
    info: 30,
    warn: 40,
    error: 50,
    fatal: 60
};

function getLogLevel(level: string): number {
    return logLevels[level] || logLevels.info;
}

function createWritable(options: { address: string; port: number }) {
    const socket: Socket = createSocket('udp4');
    return new Writable({
        final: () => socket.close(),
        write: (data, _encoding, done) => {
            socket.send(data, 0, data.length, options.port, options.address, done);
        }
    });
}

export function createUdpStream(options: { address: string; port: number }) {
    let writable = createWritable(options);
    const erroHandler = () => {
        writable = createWritable(options);
        writable.on('error', erroHandler);
    };
    writable.on('error', erroHandler);
    return {
        write: (chunk: Buffer|string, cb: (err: Error|null|undefined) => void) => {
            writable.write(chunk, cb);
        }
    };
}

export function createUdpLogTransport(
    address: string,
    port: number,
    level: LevelOption,
    additionalTags: Record<string, string | number>
) {
    const udpStream = createUdpStream({address, port});
    const udpLogTransport: UdpLogTransport = (message) => {
        let code: number | undefined;
        let stack: string | undefined;
        let errorType: string | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = message.data.find((item: any[]) => item instanceof Error);
        if (err) {
            errorType = err.type;
            code = err.code;
            stack = err.stack;
        }
        const payload = {
            level: getLogLevel(message.level),
            time: message.date.getTime(),
            pid,
            hostname: hostName,
            msg: message.data.slice(1).join(' '),
            module: message.data[0],
            code,
            stack,
            errorType,
            ...additionalTags
        };
        udpStream.write(Buffer.from(JSON.stringify(payload)), helpers.noop);
    };
    udpLogTransport.level = level;
    udpLogTransport.__udpStream = udpStream as Writable;
    return udpLogTransport;
}
