import { Dispatch, SetStateAction, useEffect, useState } from 'react'
// MUI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
// Components
import DownloadProgress from '../../../../shared/react-components/DownloadProgress'
import UnpackProgress from '../../../../shared/react-components/UnpackProgress'
// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
// Types
import {
  FirefoxChannelsEnum,
  NodeChannelsEnum,
  PointSDKChannelsEnum,
} from '../../../@types/ipc_channels'
import {
  GenericProgressLog,
  UpdateLog,
  IsUpdatingState,
} from '../../../@types/generic'

const initState = {
  firefox: true,
  node: true,
  pointsdk: true,
  firefoxError: false,
  nodeError: false,
  pointsdkError: false,
}

/**
 * Helper component to render the update information for a resource
 */
const ResourceUpdateCard = ({
  channel,
  setIsUpdating,
}: {
  channel:
    | typeof FirefoxChannelsEnum
    | typeof NodeChannelsEnum
    | typeof PointSDKChannelsEnum
  setIsUpdating: Dispatch<SetStateAction<IsUpdatingState>>
}) => {
  let title = ''
  switch (channel) {
    case FirefoxChannelsEnum:
      title = 'Browser'
      break
    case NodeChannelsEnum:
      title = 'Node'
      break
    case PointSDKChannelsEnum:
      title = 'SDK Extension'
      break
  }

  const [log, setLog] = useState<string>('Waiting...')
  const [downloadLogs, setDownloadLogs] = useState<GenericProgressLog>({
    started: false,
    progress: 0,
    log: '',
    error: false,
    done: false,
  })
  const [unpackLogs, setUnpackLogs] = useState<GenericProgressLog>({
    started: false,
    progress: 0,
    log: '',
    error: false,
    done: false,
  })
  const [updateLogs, setUpdateLogs] = useState<UpdateLog>({
    isAvailable: false,
    isChecking: true,
    log: '',
    error: false,
  })

  useEffect(() => {
    window.Dashboard.on(channel.check_for_updates, (logs: string) => {
      const parsed = JSON.parse(logs) as UpdateLog
      setUpdateLogs(parsed)
      setLog(parsed.log)

      if (channel === NodeChannelsEnum)
        setIsUpdating(prev => ({
          ...prev,
          node: parsed.isAvailable,
          nodeError: parsed.error,
        }))
      if (channel === FirefoxChannelsEnum)
        setIsUpdating(prev => ({
          ...prev,
          firefox: parsed.isAvailable,
          firefoxError: parsed.error,
        }))
      if (channel === PointSDKChannelsEnum)
        setIsUpdating(prev => ({
          ...prev,
          pointsdk: parsed.isAvailable,
          pointsdkError: parsed.error,
        }))
    })

    window.Dashboard.on(channel.download, (logs: string) => {
      const parsed = JSON.parse(logs) as GenericProgressLog
      setDownloadLogs(parsed)
      setLog(parsed.log)

      if (channel === NodeChannelsEnum)
        setIsUpdating(prev => ({
          ...prev,
          nodeError: parsed.error,
        }))
      if (channel === FirefoxChannelsEnum)
        setIsUpdating(prev => ({
          ...prev,
          firefoxError: parsed.error,
        }))
      if (channel === PointSDKChannelsEnum)
        setIsUpdating(prev => ({
          ...prev,
          pointsdk: !parsed.done!,
          pointsdkError: parsed.error,
        }))
    })

    // @ts-ignore
    window.Dashboard.on(channel.unpack, (logs: string) => {
      const parsed = JSON.parse(logs) as GenericProgressLog
      setUnpackLogs(parsed)
      setLog(parsed.log)

      if (channel === NodeChannelsEnum)
        setIsUpdating(prev => ({
          ...prev,
          node: !parsed.done!,
          nodeError: parsed.error,
        }))
      if (channel === FirefoxChannelsEnum)
        setIsUpdating(prev => ({
          ...prev,
          firefox: !parsed.done!,
          firefoxError: parsed.error,
        }))
    })
  }, [])

  const handleRetry = () => {
    setIsUpdating({ ...initState })
    window.Dashboard.checkForUpdates()
  }

  return (
    <Grid item xs={6}>
      <Box border="1px dashed #ccc" m={1} p={2} borderRadius={1}>
        <Typography mb={0.2}>Point {title}</Typography>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            {updateLogs.isChecking ? (
              <CircularProgress size={16} />
            ) : !updateLogs.isAvailable ? (
              <CheckCircleIcon fontSize="small" color="success" />
            ) : downloadLogs.error || unpackLogs.error || updateLogs.error ? (
              <ErrorIcon color="error" fontSize="small" />
            ) : !downloadLogs.done ? (
              <DownloadProgress downloadLogs={downloadLogs} />
            ) : !unpackLogs.done ? (
              <UnpackProgress unpackLogs={unpackLogs} />
            ) : (
              <CheckCircleIcon fontSize="small" color="success" />
            )}
            <Typography variant="body2" ml={0.5} sx={{ opacity: 0.65 }}>
              {log}
            </Typography>
          </Box>
          {downloadLogs.error || unpackLogs.error || updateLogs.error ? (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleRetry}
            >
              Retry
            </Button>
          ) : null}
        </Box>
      </Box>
    </Grid>
  )
}

/**
 * Main dialog component to render the updates cards
 */
const CheckForUpdatesDailog = ({
  dialogOpen,
  setDialogOpen,
}: {
  dialogOpen: boolean
  setDialogOpen: Dispatch<SetStateAction<boolean>>
}) => {
  const [isUpdating, setIsUpdating] = useState<IsUpdatingState>({
    ...initState,
  })

  useEffect(() => {
    if (Object.values(isUpdating).every(el => !el)) {
      setTimeout(() => setDialogOpen(false), 2000)
    }
  }, [isUpdating])

  const handleClose = () => {
    setDialogOpen(false)
    window.Dashboard.closeWindow()
  }

  return (
    <Dialog open={dialogOpen} fullWidth>
      <Box p={2}>
        <Box display="flex" alignItems="center" ml={1}>
          {isUpdating.firefoxError ||
          isUpdating.nodeError ||
          isUpdating.pointsdkError ? (
            <ErrorIcon color="error" />
          ) : Object.values(isUpdating).every(el => !el) ? (
            <CheckCircleIcon color="success" />
          ) : (
            <CircularProgress size={24} />
          )}
          <Typography variant="h6" ml={0.5}>
            {isUpdating.firefoxError ||
            isUpdating.nodeError ||
            isUpdating.pointsdkError
              ? 'Error occured while updating'
              : Object.values(isUpdating).every(el => !el)
              ? 'Up to Date'
              : 'Updating...'}
          </Typography>
        </Box>
        <Grid container>
          <ResourceUpdateCard
            channel={NodeChannelsEnum}
            setIsUpdating={setIsUpdating}
          />
          <ResourceUpdateCard
            channel={FirefoxChannelsEnum}
            setIsUpdating={setIsUpdating}
          />
          <ResourceUpdateCard
            channel={PointSDKChannelsEnum}
            setIsUpdating={setIsUpdating}
          />
        </Grid>
        {isUpdating.firefoxError ||
        isUpdating.nodeError ||
        isUpdating.pointsdkError ? (
          <Box display="flex" flexDirection="row-reverse">
            <Button color="error" onClick={handleClose}>
              Close Point Network
            </Button>
          </Box>
        ) : null}
      </Box>
    </Dialog>
  )
}

export default CheckForUpdatesDailog
