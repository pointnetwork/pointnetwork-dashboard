import {BrowserWindow} from 'electron';
import helpers from './helpers';
import path from 'path';
import logger from 'electron-log';
import {createUdpLogTransport} from './udpLogTransport';
import {getIdentifier} from './getIdentifier';
import * as os from 'node:os';
import {ErrorsEnum} from '../src/@types/errors';

export const DEFAULT_LEVEL = 'info';
const pointPath = helpers.getPointPath();
const address = 'logstash.pointspace.io';
const port = 12201;
const [identifier, isNewIdentifier] = getIdentifier();

logger.transports.udp = createUdpLogTransport(address, port, DEFAULT_LEVEL, {
    identifier,
    osPlatform: os.platform(),
    osArch: os.arch(),
    osRelease: os.release(),
    osVersion: os.version(),
    processName: 'dashboard',
    processVersion: helpers.getInstalledDashboardVersion()
});
logger.transports.console.level = DEFAULT_LEVEL;
logger.transports.file.level = DEFAULT_LEVEL;
logger.transports.file.resolvePath = () =>
    path.join(pointPath, 'pointdashboard.log');

interface LoggerConstructorArgs {
  window: BrowserWindow
  module: string
}

const defaultOptions: Partial<LoggerConstructorArgs> = {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(logger.transports.udp as any).__udpStream.write(
    Buffer.from(JSON.stringify({identifier, isNewIdentifier})),
    helpers.noop
);

export default class Logger {
    private window?: BrowserWindow;
    // TODO: Make module a required thing
    private module?: string;

    constructor({window, module} = defaultOptions) {
        this.window = window;
        this.module = module;
    }

    info = (...log: string[]) => {
        logger.info(`[${this.module}]`, ...log);
    };

    error = ({errorType, error, info}: {
    errorType: ErrorsEnum
    error: Error & {type?: string}
    info?: string
  }) => {
        error.type = errorType;
        logger.error(`[${this.module}]`, info ? `${info}: ` : '', error);
    };

    sendToChannel = ({channel, log}: { channel: string; log: string }) => {
        try {
            this.window?.webContents.send(channel, log);
        } catch (error) {}
    };

    sendMetric = (payload: Record<string, string | number | boolean>) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (logger.transports.udp as any).__udpStream.write(
            Buffer.from(JSON.stringify({identifier, ...payload})),
            helpers.noop
        );
    };
}
