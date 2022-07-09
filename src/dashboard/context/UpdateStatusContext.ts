import {createContext, useEffect, useState} from "react";
import {GenericProgressLog, IsUpdatingState, UpdateLog} from "../../@types/generic";
import {
  FirefoxChannelsEnum,
  NodeChannelsEnum,
  PointSDKChannelsEnum
} from "../../@types/ipc_channels";
import {UpdateStatus} from "../../@types/context";

export const useUpdateStatus = () => {
  const [isUpdating, setIsUpdating] = useState<IsUpdatingState>({
    firefox: false,
    node: false,
    pointsdk: false,
    firefoxError: false,
    nodeError: false,
    pointsdkError: false,
  })
  const updateDialogOpen = Object.keys(isUpdating)
    .reduce((acc, cur) => acc || isUpdating[cur as 'firefox'], false)

  const [nodeLog, setNodeLog] = useState('')
  const [nodeDownloadLogs, setNodeDownloadLogs] = useState<GenericProgressLog>({
    started: false,
    progress: 0,
    log: '',
    error: false,
    done: false,
  })
  const [nodeUnpackLogs, setNodeUnpackLogs] = useState<GenericProgressLog>({
    started: false,
    progress: 0,
    log: '',
    error: false,
    done: false,
  })
  const [nodeUpdateLogs, setNodeUpdateLogs] = useState<UpdateLog>({
    isAvailable: false,
    isChecking: true,
    log: '',
    error: false
  })

  const [firefoxLog, setFirefoxLog] = useState('')
  const [firefoxDownloadLogs, setFirefoxDownloadLogs] = useState<GenericProgressLog>({
    started: false,
    progress: 0,
    log: '',
    error: false,
    done: false,
  })
  const [firefoxUnpackLogs, setFirefoxUnpackLogs] = useState<GenericProgressLog>({
    started: false,
    progress: 0,
    log: '',
    error: false,
    done: false,
  })
  const [firefoxUpdateLogs, setFirefoxUpdateLogs] = useState<UpdateLog>({
    isAvailable: false,
    isChecking: true,
    log: '',
    error: false
  })

  const [sdkLog, setSdkLog] = useState('')
  const [sdkDownloadLogs, setSdkDownloadLogs] = useState<GenericProgressLog>({
    started: false,
    progress: 0,
    log: '',
    error: false,
    done: false,
  })
  const [sdkUpdateLogs, setSdkUpdateLogs] = useState<UpdateLog>({
    isAvailable: false,
    isChecking: true,
    log: '',
    error: false
  })

  useEffect(() => {
    window.Dashboard.on(NodeChannelsEnum.check_for_updates, (logs: string) => {
      const parsed = JSON.parse(logs) as UpdateLog
      setNodeUpdateLogs(parsed)
      setNodeLog(parsed.log)
      setIsUpdating(prev => ({
        ...prev,
        node: parsed.isAvailable,
        nodeError: parsed.error
      }))
    })
    window.Dashboard.on(FirefoxChannelsEnum.check_for_updates, (logs: string) => {
      const parsed = JSON.parse(logs) as UpdateLog
      setFirefoxUpdateLogs(parsed)
      setFirefoxLog(parsed.log)
      setIsUpdating(prev => ({
        ...prev,
        firefox: parsed.isAvailable,
        firefoxError: parsed.error
      }))
    })
    window.Dashboard.on(PointSDKChannelsEnum.check_for_updates, (logs: string) => {
      const parsed = JSON.parse(logs) as UpdateLog
      setSdkUpdateLogs(parsed)
      setSdkLog(parsed.log)
      setIsUpdating(prev => ({
        ...prev,
        pointsdk: parsed.isAvailable,
        pointsdkError: parsed.error
      }))
    })

    window.Dashboard.on(NodeChannelsEnum.download, (logs: string) => {
      const parsed = JSON.parse(logs) as GenericProgressLog
      setNodeDownloadLogs(parsed)
      setNodeLog(parsed.log)
      setIsUpdating(prev => ({
        ...prev,
        nodeError: parsed.error,
      }))
    })
    window.Dashboard.on(FirefoxChannelsEnum.download, (logs: string) => {
      const parsed = JSON.parse(logs) as GenericProgressLog
      setFirefoxDownloadLogs(parsed)
      setFirefoxLog(parsed.log)
      setIsUpdating(prev => ({
        ...prev,
        firefoxError: parsed.error,
      }))
    })
    window.Dashboard.on(PointSDKChannelsEnum.download, (logs: string) => {
      const parsed = JSON.parse(logs) as GenericProgressLog
      setSdkDownloadLogs(parsed)
      setSdkLog(parsed.log)
      setIsUpdating(prev => ({
        ...prev,
        pointsdk: !parsed.done,
        pointsdkError: parsed.error,
      }))
    })

    window.Dashboard.on(NodeChannelsEnum.unpack, (logs: string) => {
      const parsed = JSON.parse(logs) as GenericProgressLog
      setNodeUnpackLogs(parsed)
      setNodeLog(parsed.log)
      setIsUpdating(prev => ({
        ...prev,
        node: !parsed.done,
        nodeError: parsed.error,
      }))
    })
    window.Dashboard.on(FirefoxChannelsEnum.unpack, (logs: string) => {
      const parsed = JSON.parse(logs) as GenericProgressLog
      setFirefoxUnpackLogs(parsed)
      setFirefoxLog(parsed.log)
      setIsUpdating(prev => ({
        ...prev,
        firefox: !parsed.done,
        firefoxError: parsed.error,
      }))
    })
  }, [])

  return {
    isUpdating,
    updateDialogOpen,
    nodeLog,
    nodeDownloadLogs,
    nodeUpdateLogs,
    nodeUnpackLogs,
    firefoxLog,
    firefoxDownloadLogs,
    firefoxUpdateLogs,
    firefoxUnpackLogs,
    sdkLog,
    sdkDownloadLogs,
    sdkUpdateLogs
  }
}

export const UpdateStatusContext = createContext<UpdateStatus>({} as unknown as UpdateStatus)
