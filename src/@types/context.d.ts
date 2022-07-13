import {
  GenericProgressLog,
  IdentityLog,
  IsUpdatingState,
  UpdateLog,
} from './generic'

export type MainStatus = {
  isBrowserRunning: boolean
  isNodeRunning: boolean
  identifier: string
  browserVersion: string
  nodeVersion: string
  launchAttempts: number
  loader: {
    isLoading: boolean
    message: string
  }
  identityInfo: IdentityLog
  balance: string | number
}

export type UpdateStatus = {
  isUpdating: IsUpdatingState
  updateDialogOpen: boolean
  nodeLog: string
  nodeDownloadLogs: GenericProgressLog
  nodeUpdateLogs: UpdateLog
  nodeUnpackLogs: GenericProgressLog
  firefoxLog: string
  firefoxDownloadLogs: GenericProgressLog
  firefoxUpdateLogs: UpdateLog
  firefoxUnpackLogs: GenericProgressLog
  sdkLog: string
  sdkDownloadLogs: GenericProgressLog
  sdkUpdateLogs: UpdateLog
}
