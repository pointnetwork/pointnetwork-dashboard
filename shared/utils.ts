import util from 'node:util'
import extract from 'extract-zip'
import { https } from 'follow-redirects'
// Types
import {
  NodeChannelsEnum,
  FirefoxChannelsEnum,
  PointSDKChannelsEnum,
  UninstallerChannelsEnum,
} from './../src/@types/ipc_channels'
import {
  Utils,
  DownloadFunction,
  ExtractZipFunction,
  KillFunction,
  ThrowErrorFunction,
} from '../src/@types/utils'
import { ErrorsEnum } from './../src/@types/errors'
import { GenericProgressLog } from '../src/@types/generic'

const exec = util.promisify(require('child_process').exec)

/**
 * Downloads from the given downloadURL and pips it to downloadStream
 * Takes optional logger, asset and channel arguments to send logs to the window channel
 * onProgress callback returns the download progress
 */
const download: DownloadFunction = ({
  logger,
  channel,
  downloadUrl,
  downloadStream,
  onProgress,
}) =>
  new Promise(resolve => {
    let asset = ''
    try {
      switch (channel) {
        case NodeChannelsEnum.download:
          asset = 'Node'
          break
        case FirefoxChannelsEnum.download:
          asset = 'Browser'
          break
        case PointSDKChannelsEnum.download:
          asset = 'SDK Extension'
          break
        case UninstallerChannelsEnum.download:
          asset = 'Uninstaller'
          break
      }

      channel &&
        logger?.sendToChannel({
          channel,
          log: JSON.stringify({
            started: true,
            log: `Starting to download Point ${asset}`,
          } as GenericProgressLog),
        })

      https.get(downloadUrl, { timeout: 10000 }, async response => {
        response.pipe(downloadStream)

        const total = response.headers['content-length']
        let downloaded = 0
        let percentage = 0
        let temp = 0
        response.on('data', chunk => {
          downloaded += Buffer.from(chunk).length

          temp = Math.round((downloaded * 100) / Number(total))

          if (temp !== percentage) {
            percentage = temp
            onProgress && onProgress(percentage)

            channel &&
              logger?.sendToChannel({
                channel,
                log: JSON.stringify({
                  log: `Downloading Point ${asset}`,
                  progress: percentage,
                } as GenericProgressLog),
              })
          }
        })

        response.on('error', error => {
          throwError({ type: ErrorsEnum.DOWNLOAD_ERROR, error })
        })

        response.on('close', () => {
          channel &&
            logger?.sendToChannel({
              channel,
              log: JSON.stringify({
                started: false,
                log: `Point ${asset} downloaded`,
                progress: 100,
                done: true,
              } as GenericProgressLog),
            })
          resolve()
        })
      })
    } catch (error) {
      channel &&
        logger?.sendToChannel({
          channel,
          log: JSON.stringify({
            log: `Error downloading Point ${asset}`,
            error: true,
          } as GenericProgressLog),
        })
      throwError({ type: ErrorsEnum.DOWNLOAD_ERROR, error })
    }
  })

const extractZip: ExtractZipFunction = ({ src, dest, onProgress }) =>
  // eslint-disable-next-line no-async-promise-executor
  new Promise(async (resolve, reject) => {
    try {
      await extract(src, {
        dir: dest,
        onEntry: (_, zipfile) => {
          const extracted = zipfile.entriesRead
          const total = zipfile.entryCount

          onProgress && onProgress(Math.round((extracted / total) * 100))
        },
      })
      resolve()
    } catch (error) {
      reject(error)
    }
  })

const kill: KillFunction = async ({ processId, onMessage }) => {
  try {
    onMessage(`Killing process with PID: ${processId}`)
    const cmd = global.platform.win32
      ? `taskkill /F /PID "${processId}"`
      : `kill "${processId}"`
    const output = await exec(cmd)
    onMessage(`Killed PID: ${processId} with Output: ${output}`)
  } catch (error: any) {
    throw new Error(error)
  }
}

const throwError: ThrowErrorFunction = ({ error, type, reject }) => {
  if (reject) reject(new Error(`${type} >> ` + error))
  else throw new Error(`${type} >> ` + error)
}

const utils: Utils = Object.freeze({
  download,
  extractZip,
  kill,
  throwError,
})
export default utils
