import { WriteStream } from 'fs-extra'
import { BrowserWindow } from 'electron'

export interface DownloadArgs {
  downloadUrl: string
  downloadStream: WriteStream
  window: BrowserWindow
  initializerChannel: string
  progressChannel: string
  finishChannel: string
}
export type DownloadFunction = (args: DownloadArgs) => Promise<void>

export interface ExtractZipArgs {
  src: string
  dest: string
  window: BrowserWindow
  initializerChannel: string
  progressChannel: string
  finishChannel: string
}
export type ExtractZipFunction = (args: ExtractZipArgs) => Promise<void>

export interface Utils {
  download: DownloadFunction
  extractZip: ExtractZipFunction
}
