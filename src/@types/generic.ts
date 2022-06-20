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
  started: boolean
  done: boolean
  progress?: number
  log: string
}
