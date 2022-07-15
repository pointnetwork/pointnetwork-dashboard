import { createWriteStream } from "fs-extra";
import utils from './utils';
import { DownloadChannels } from "../src/@types/ipc_channels";

export async function downlaodFileToDest(downloadUrl: string, downloadDest: string, logger?: any, channel?: DownloadChannels) {
  const downloadStream = createWriteStream(downloadDest);
  return utils.download({
    channel,
    logger,
    downloadUrl,
    downloadStream,
  });
}
