import {createWriteStream} from 'fs-extra';
import utils from './utils';
import {DownloadChannels} from '../src/@types/ipc_channels';
import Logger from './logger';

export async function downloadFileToDest(
    downloadUrl: string,
    downloadDest: string,
    logger?: Logger,
    channel?: DownloadChannels
) {
    const downloadStream = createWriteStream(downloadDest);
    return utils.download({
        channel,
        logger,
        downloadUrl,
        downloadStream
    });
}
