export type Process = {
  pid: number
  ppid?: number
  uid?: number
  gid?: number
  name: string
  bin?: string
  cmd: string
}
