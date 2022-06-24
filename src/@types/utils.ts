import { WriteStream } from 'fs-extra'
import Logger from '../../shared/logger'
import {
  FirefoxChannelsEnum,
  NodeChannelsEnum,
  PointSDKChannelsEnum,
  UninstallerChannelsEnum,
} from './ipc_channels'

export type DownloadFunction = (_: {
  logger?: Logger
  channel?:
    | NodeChannelsEnum.download
    | FirefoxChannelsEnum.download
    | PointSDKChannelsEnum.download
    | UninstallerChannelsEnum.download
  downloadUrl: string
  downloadStream: WriteStream
  onProgress?: (progress: number) => void
}) => Promise<void>

export type ExtractZipFunction = (_: {
  src: string
  dest: string
  onProgress?: (progress: number) => void
}) => Promise<void>

export type KillFunction = (_: {
  processId: number
  onMessage: (message: string) => void
}) => void

export interface Utils {
  download: DownloadFunction
  extractZip: ExtractZipFunction
  kill: KillFunction
}
