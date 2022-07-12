import { readFile, createWriteStream } from "fs-extra";
import utils from './utils';
import { createHash } from 'crypto';
import retry from 'async-retry';
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

  export async function getSumsHashFromFile(sumsFilePath: string) {
    const hashes = await readFile(sumsFilePath);
    const hashesContent = hashes.toString();
    const lines = hashesContent.split("\n");
    const shaRegex = /point.*: .{64}/;
    if (lines[0] === 'Not Found') {
      throw Error('Sum File was not Found');
    }
    if (lines.every((line: string) => line.match(shaRegex))) {
      const fileHashes = lines.reduce((prev: Record<string, string>, line: string) => {
        const [filename, hash] = line.split(": ");
        const platform = filename.split('-')[1];
        return {
          ...prev,
          [platform]: hash
        }
      }, Object.create(null));
      return fileHashes;
    }
    throw Error('The sums file is corrupted or the file format is not compatible');
  }

  export async function getFileSum(filePath: string) {
    const fileBuffer = await readFile(filePath);
    const hashSum = createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

export async function downloadAndVerifyFileIntegrity(platform: string, downloadUrl: string, downloadDest: string, sumFileUrl: string, sumFileDest: string, logger?: any, channel?: DownloadChannels) {
  await retry(
    async () => {
        await downlaodFileToDest(downloadUrl, downloadDest, logger, channel);
        await downlaodFileToDest(sumFileUrl, sumFileDest)
        const fileSum = await getFileSum(downloadDest);
        try {
          const fileSumsHash = await getSumsHashFromFile(sumFileDest);
          if (fileSum !== fileSumsHash[platform]) {
            console.log({ fileSum, hash: fileSumsHash[platform], platform })
            const errorMsg = `File seems corrupted current sum is: ${fileSum} expected was ${fileSumsHash[platform]}, downloading it again`
            logger?.error(errorMsg)
            throw Error(errorMsg);
          }
          logger?.info(`File from ${downloadUrl} was downloaded, integrity ok with sum: ${fileSum} `)
        } catch (e) {
          logger?.error('The sum file was not found or is corrupted, skipping file integrity verification')
        }
    },
    {
      retries: 5
    }
  )
}