import util from 'node:util'
import extract from 'extract-zip'
import { https } from 'follow-redirects'
import {
  Utils,
  DownloadFunction,
  ExtractZipFunction,
  KillFunction,
} from '../src/@types/utils'

const exec = util.promisify(require('child_process').exec)

const download: DownloadFunction = ({
  downloadUrl,
  downloadStream,
  onProgress,
}) =>
  new Promise((resolve, reject) => {
    try {
      https.get(downloadUrl, async response => {
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
          }
        })

        response.on('close', () => {
          resolve()
        })
      })
    } catch (error) {
      reject(error)
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

const utils: Utils = Object.freeze({
  download,
  extractZip,
  kill,
})
export default utils
