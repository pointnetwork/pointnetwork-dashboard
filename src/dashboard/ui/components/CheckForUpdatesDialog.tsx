import {FunctionComponent, useContext} from 'react'
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
// Context
import {UpdateStatusContext} from "../../context/UpdateStatusContext";
import {GenericProgressLog, UpdateLog} from "../../../@types/generic";

/**
 * Helper component to render the update information for a resource
 */
const ResourceUpdateCard: FunctionComponent<{
  channel:
    | typeof FirefoxChannelsEnum
    | typeof NodeChannelsEnum
    | typeof PointSDKChannelsEnum
  log: string
  updateLogs: UpdateLog
  downloadLogs: GenericProgressLog
  unpackLogs?: GenericProgressLog
}> = ({channel, log, updateLogs, downloadLogs, unpackLogs}) => {
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

  const handleRetry = () => {
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
            ) : downloadLogs.error || unpackLogs?.error || updateLogs.error ? (
              <ErrorIcon color="error" fontSize="small" />
            ) : !downloadLogs.done ? (
              <DownloadProgress downloadLogs={downloadLogs} />
            ) : unpackLogs && !unpackLogs.done ? (
              <UnpackProgress unpackLogs={unpackLogs} />
            ) : (
              <CheckCircleIcon fontSize="small" color="success" />
            )}
            <Typography variant="body2" ml={0.5} sx={{ opacity: 0.65 }}>
              {log}
            </Typography>
          </Box>
          {downloadLogs.error || unpackLogs?.error || updateLogs.error ? (
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
const CheckForUpdatesDialog: FunctionComponent = () => {
  const {
    updateDialogOpen,
    isUpdating,
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
  } = useContext(UpdateStatusContext)

  const handleClose = () => {
    window.Dashboard.closeWindow()
  }

  return (
    <Dialog open={updateDialogOpen} fullWidth>
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
            log={nodeLog}
            downloadLogs={nodeDownloadLogs}
            updateLogs={nodeUpdateLogs}
            unpackLogs={nodeUnpackLogs}
          />
          <ResourceUpdateCard
            channel={FirefoxChannelsEnum}
            log={firefoxLog}
            downloadLogs={firefoxDownloadLogs}
            updateLogs={firefoxUpdateLogs}
            unpackLogs={firefoxUnpackLogs}
          />
          <ResourceUpdateCard
            channel={PointSDKChannelsEnum}
            log={sdkLog}
            downloadLogs={sdkDownloadLogs}
            updateLogs={sdkUpdateLogs}
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

export default CheckForUpdatesDialog
