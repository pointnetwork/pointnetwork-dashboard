import { WriteStream } from 'fs-extra'
import { BrowserWindow } from 'electron'

export type DownloadFunction = (_: {
  downloadUrl: string
  downloadStream: WriteStream
  onProgress: (progress: number) => void
}) => Promise<void>

export type ExtractZipFunction = (_: {
  src: string
  dest: string
  window: BrowserWindow
  initializerChannel: string
  progressChannel: string
  finishChannel: string
}) => Promise<void>

export interface Utils {
  download: DownloadFunction
  extractZip: ExtractZipFunction
}
