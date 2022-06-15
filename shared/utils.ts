import extract from 'extract-zip'
import { https } from 'follow-redirects'
import {
  Utils,
  DownloadFunction,
  ExtractZipFunction,
} from '../src/@types/utils'

const download: DownloadFunction = ({
  downloadUrl,
  downloadStream,
  window,
  initializerChannel,
  progressChannel,
  finishChannel,
}) =>
  new Promise((resolve, reject) => {
    try {
      window.webContents.send(initializerChannel)

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
            window.webContents.send(progressChannel, percentage)
          }
        })

        response.on('close', () => {
          window.webContents.send(finishChannel)
          resolve()
        })
      })
    } catch (error) {
      reject(error)
    }
  })

const extractZip: ExtractZipFunction = ({
  src,
  dest,
  window,
  initializerChannel,
  progressChannel,
  finishChannel,
}) =>
  // eslint-disable-next-line no-async-promise-executor
  new Promise(async (resolve, reject) => {
    try {
      window.webContents.send(initializerChannel)
      await extract(src, {
        dir: dest,
        onEntry: (_, zipfile) => {
          const extracted = zipfile.entriesRead
          const total = zipfile.entryCount
          const progress = Math.round((extracted / total) * 100)

          window.webContents.send(progressChannel, progress)
        },
      })
      window.webContents.send(finishChannel)
      resolve()
    } catch (error) {
      reject(error)
    }
  })

const utils: Utils = Object.freeze({
  download,
  extractZip,
})
export default utils
