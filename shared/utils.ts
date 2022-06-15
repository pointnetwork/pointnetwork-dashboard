import { BrowserWindow } from 'electron'
import { https } from 'follow-redirects'
import { WriteStream } from 'fs-extra'

interface DownloadArgs {
  downloadUrl: string
  downloadStream: WriteStream
  window: BrowserWindow
  initializerChannel: string
  progressChannel: string
  finishChannel: string
}
type DownloadFunction = (args: DownloadArgs) => Promise<void>

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
      console.log(initializerChannel)
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
            console.log(progressChannel, percentage)
          }
        })

        response.on('close', () => {
          console.log(finishChannel)
          window.webContents.send(finishChannel)
          resolve()
        })
      })
    } catch (error) {
      reject(error)
    }
  })

export default Object.freeze({
  download,
})
