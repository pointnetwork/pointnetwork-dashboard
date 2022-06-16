import { WriteStream } from 'fs-extra'

export type DownloadFunction = (_: {
  downloadUrl: string
  downloadStream: WriteStream
  onProgress?: (progress: number) => void
}) => Promise<void>

export type ExtractZipFunction = (_: {
  src: string
  dest: string
  onProgress?: (progress: number) => void
}) => Promise<void>

export interface Utils {
  download: DownloadFunction
  extractZip: ExtractZipFunction
}
