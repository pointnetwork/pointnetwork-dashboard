import { readFile } from "fs-extra";
import { createHash } from 'crypto';
import retry from 'async-retry';
import { DownloadChannels } from "../src/@types/ipc_channels";
import { downlaodFileToDest } from "./downloadFileToDest";
import Logger from "./logger";

const DEFAULT_RETRIES = 5;

  export async function getChecksumsFromFile(sumsFilePath: string) {
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

interface DownloadAndVerifyFileIntegrityOpts {
  retryOptions?: retry.Options,
  platform: string,
  downloadUrl: string,
  downloadDest: string,
  sumFileUrl: string,
  sumFileDest: string,
  logger?: Logger,
  channel?: DownloadChannels
}

export async function downloadAndVerifyFileIntegrity(
  { retryOptions, platform, downloadUrl, downloadDest, sumFileUrl, sumFileDest, logger, channel }: DownloadAndVerifyFileIntegrityOpts
) {
  await retry(
    async () => {
        await downlaodFileToDest(downloadUrl, downloadDest, logger, channel);
        await downlaodFileToDest(sumFileUrl, sumFileDest)
        const fileSum = await getFileSum(downloadDest);
        let fileSumsHash;
        try {
          fileSumsHash = await getChecksumsFromFile(sumFileDest);
        } catch (e) {
          logger?.error('The sum file was not found or is corrupted, skipping file integrity verification')
          return;
        }
        if (fileSum !== fileSumsHash[platform]) {
          const errorMsg = `File seems corrupted current sum is: ${fileSum} expected was ${fileSumsHash[platform]}, downloading it again`
          logger?.error(errorMsg)
          throw Error(errorMsg);
        }
        logger?.info(`File from ${downloadUrl} was downloaded, integrity ok with sum: ${fileSum} `)
    },
    retryOptions || {
      retries: DEFAULT_RETRIES
    }
  )
}
