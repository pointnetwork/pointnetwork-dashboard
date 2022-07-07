import { Dispatch, SetStateAction, useEffect, useState } from 'react'
// MUI
import Box from '@mui/material/Box'
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

  const [log, setLog] = useState<string>('')
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
  })

  useEffect(() => {
    window.Dashboard.on(channel.check_for_updates, (logs: string) => {
      const parsed = JSON.parse(logs) as UpdateLog
      setUpdateLogs(parsed)
      setLog(parsed.log)

      if (channel === NodeChannelsEnum)
        setIsUpdating(prev => ({ ...prev, node: parsed.isAvailable }))
      if (channel === FirefoxChannelsEnum)
        setIsUpdating(prev => ({ ...prev, firefox: parsed.isAvailable }))
      if (channel === PointSDKChannelsEnum)
        setIsUpdating(prev => ({ ...prev, pointsdk: parsed.isAvailable }))
    })

    window.Dashboard.on(channel.download, (logs: string) => {
      const parsed = JSON.parse(logs) as GenericProgressLog
      setDownloadLogs(parsed)
      setLog(parsed.log)

      if (channel === PointSDKChannelsEnum)
        setIsUpdating(prev => ({ ...prev, pointsdk: !parsed.done! }))
    })

    // @ts-ignore
    window.Dashboard.on(channel.unpack, (logs: string) => {
      const parsed = JSON.parse(logs) as GenericProgressLog
      setUnpackLogs(parsed)
      setLog(parsed.log)

      if (channel === NodeChannelsEnum)
        setIsUpdating(prev => ({ ...prev, node: !parsed.done! }))
      if (channel === FirefoxChannelsEnum)
        setIsUpdating(prev => ({ ...prev, firefox: !parsed.done! }))
    })
  }, [])

  return (
    <Grid item xs={6}>
      <Box border="1px dashed #ccc" m={1} p={2} borderRadius={1}>
        <Typography mb={0.2}>Point {title}</Typography>
        <Box display="flex" alignItems="center">
          {updateLogs.isChecking ? (
            <CircularProgress size={16} />
          ) : !updateLogs.isAvailable ? (
            <CheckCircleIcon fontSize="small" color="success" />
          ) : downloadLogs.error || unpackLogs.error ? (
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
    firefox: false,
    node: false,
    pointsdk: false
  })

  useEffect(() => {
    if (Object.values(isUpdating).every(el => !el)) {
      setTimeout(() => setDialogOpen(false), 2000)
    }
  }, [isUpdating])

  return (
    <Dialog open={dialogOpen} fullWidth>
      <Box p={2}>
        <Box display="flex" alignItems="center" ml={1}>
          {Object.values(isUpdating).every(el => !el) ? (
            <CheckCircleIcon color="success" />
          ) : (
            <CircularProgress size={24} />
          )}
          <Typography variant="h6" ml={0.5}>
            {Object.values(isUpdating).every(el => !el)
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
      </Box>
    </Dialog>
  )
}

export default CheckForUpdatesDailog
