import util from 'node:util';
import extract from 'extract-zip';
import {FollowResponse, https} from 'follow-redirects';
import {IncomingMessage} from 'http';
// Types
import {
    NodeChannelsEnum,
    FirefoxChannelsEnum,
    PointSDKChannelsEnum,
    UninstallerChannelsEnum
} from './../src/@types/ipc_channels';
import {
    Utils,
    DownloadFunction,
    ExtractZipFunction,
    KillFunction
} from '../src/@types/utils';
import {ErrorsEnum} from './../src/@types/errors';
import {GenericProgressLog} from '../src/@types/generic';

const exec = util.promisify(require('child_process').exec);

/**
 * Downloads from the given downloadURL and pips it to downloadStream
 * Takes optional logger, asset and channel arguments to log and send logs to the window channel
 * onProgress callback returns the download progress
 */
const download: DownloadFunction = ({
    logger,
    channel,
    downloadUrl,
    downloadStream,
    onProgress
}) =>
    new Promise((resolve, reject) => {
        let asset = '';
        let res: IncomingMessage & FollowResponse;
        try {
            switch (channel) {
                case NodeChannelsEnum.download:
                    asset = 'Engine';
                    break;
                case FirefoxChannelsEnum.download:
                    asset = 'Browser';
                    break;
                case PointSDKChannelsEnum.download:
                    asset = 'SDK Extension';
                    break;
                case UninstallerChannelsEnum.download:
                    asset = 'Uninstaller';
                    break;
            }

            logger?.info(`Downloading Point ${asset}`);
            if (channel) {
                logger?.sendToChannel({
                    channel,
                    log: JSON.stringify({
                        started: true,
                        log: `Starting to download Point ${asset}`
                    } as GenericProgressLog)
                });
            }

            const req = https.get(downloadUrl, {timeout: 15000}, async response => {
                res = response;

                response.pipe(downloadStream);

                const total = response.headers['content-length'];
                let downloaded = 0;
                let percentage = 0;
                let temp = 0;
                response.on('data', chunk => {
                    downloaded += Buffer.from(chunk).length;

                    temp = Math.round((downloaded * 100) / Number(total));

                    if (temp !== percentage) {
                        percentage = temp;
                        if (onProgress) {
                            onProgress(percentage);
                        }

                        if (channel) {
                            logger?.sendToChannel({
                                channel,
                                log: JSON.stringify({
                                    log: `Downloading Point ${asset}`,
                                    progress: percentage
                                } as GenericProgressLog)
                            });
                        }
                    }
                });

                response.on('end', () => {
                    logger?.info(`Downloaded Point ${asset}`);
                    if (channel) {
                        logger?.sendToChannel({
                            channel,
                            log: JSON.stringify({
                                started: false,
                                log: `Point ${asset} downloaded`,
                                progress: 100,
                                done: true
                            } as GenericProgressLog)
                        });
                    }
                    resolve();
                });
            });

            req.on('error', error => {
                if (channel) {
                    logger?.sendToChannel({
                        channel,
                        log: JSON.stringify({
                            log: 'Request failed',
                            error: true
                        } as GenericProgressLog)
                    });
                }
                logger?.error({errorType: ErrorsEnum.DOWNLOAD_ERROR, info: 'Request failed', error});
                reject(error);
            });

            req.on('timeout', error => {
                if (channel) {
                    logger?.sendToChannel({
                        channel,
                        log: JSON.stringify({
                            log: 'Internet connection lost',
                            error: true
                        } as GenericProgressLog)
                    });
                }
                logger?.error({errorType: ErrorsEnum.DOWNLOAD_ERROR, info: 'TIMEOUT', error});
                reject(error);
                req.destroy();
                res?.pause();
            });
        } catch (error) {
            if (channel) {
                logger?.sendToChannel({
                    channel,
                    log: JSON.stringify({
                        log: `Error downloading Point ${asset}`,
                        error: true
                    } as GenericProgressLog)
                });
            }
            logger?.error({errorType: ErrorsEnum.DOWNLOAD_ERROR, error});
            reject(error);
        }
    });

/**
 * Extracts given 'zipped' `src` to `dest`
 * Takes optional onProgress callback to show the progress
 */
const extractZip: ExtractZipFunction = ({src, dest, onProgress}) =>
// eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve, reject) => {
        try {
            await extract(src, {
                dir: dest,
                onEntry: (_, zipfile) => {
                    const extracted = zipfile.entriesRead;
                    const total = zipfile.entryCount;

                    if (onProgress) {
                        onProgress(Math.round((extracted / total) * 100));
                    }
                }
            });
            resolve();
        } catch (error) {
            reject(error);
        }
    });

/**
 * Kills the process with the given `processId`
 */
const kill: KillFunction = async ({processId, onMessage}) => {
    onMessage(`Killing process with PID: ${processId}`);
    const cmd = global.platform.win32
        ? `taskkill /F /PID "${processId}"`
        : `kill "${processId}"`;
    const output = await exec(cmd);
    onMessage(`Killed PID: ${processId} with Output: ${JSON.stringify(output, null, 2)}`);
};

const utils: Utils = Object.freeze({
    download,
    extractZip,
    kill
});
export default utils;
