import { IpcMainEvent } from 'electron'

export interface IsUpdatingState {
  firefox: boolean
  node: boolean
  pointsdk: boolean
}

export interface EventListener {
  channel: string
  listener: (_: IpcMainEvent, args: any[]) => void
}

export interface Process {
  pid: number
  ppid?: number
  uid?: number
  gid?: number
  name: string
  bin?: string
  cmd: string
}

export interface LaunchProcessLog {
  isRunning: boolean
  log: string
}

export interface IdentityLog {
  isFetching: boolean
  identity: string
  address: string
  log: string
}

export interface UpdateLog {
  isChecking: boolean
  isAvailable: boolean
  log: string
}

export interface GenericProgressLog {
  started?: boolean
  done?: boolean
  progress?: number
  log: string
  error?: boolean
}

export type GithubRelease = {
  id: number
  url: string
  tag_name: string // eslint-disable-line camelcase
  name: string
  assets: Array<{
    id: number
    name: string
    browser_download_url: string // eslint-disable-line camelcase
  }>
}

export interface StartTimeoutState {
  isTimedOut: boolean
  isSet: boolean
}
