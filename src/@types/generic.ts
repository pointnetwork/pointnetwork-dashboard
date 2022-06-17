export interface DownloadLog {
  isDownloading: boolean
  progress: number | string
  log: string
  isDownloaded: boolean
}

export interface UnpackLog {
  isUnpacking: boolean
  log: string
  progress: number | string
  isUnpacked: boolean
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

export interface StopProcessLog {
  isStopping: boolean
  log: string
  isStopped: boolean
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
