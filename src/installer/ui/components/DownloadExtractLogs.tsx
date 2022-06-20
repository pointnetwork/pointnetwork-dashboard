import { useEffect, useState } from 'react'
// MUI
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileDownloadDoneIcon from '@mui/icons-material/FileDownloadDone'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import FolderZipIcon from '@mui/icons-material/FolderZip'
// Types
import {
  FirefoxChannelsEnum,
  NodeChannelsEnum,
  PointSDKChannelsEnum,
  UninstallerChannelsEnum,
} from '../../../@types/ipc_channels'
import { GenericProgressLog } from '../../../@types/generic'

const DownloadExtractLogs = ({
  title,
  downloadChannel,
  unpackChannel,
}: {
  title: 'Browser' | 'Node' | 'SDK Extenstion' | 'Uninstaller'
  downloadChannel:
    | NodeChannelsEnum.download
    | FirefoxChannelsEnum.download
    | PointSDKChannelsEnum.download
    | UninstallerChannelsEnum.download
  unpackChannel?:
    | NodeChannelsEnum.unpack
    | FirefoxChannelsEnum.unpack
    | UninstallerChannelsEnum.unpack
}) => {
  const [log, setLog] = useState<string>('Waiting...')
  const [downloadLogs, setDownloadLogs] = useState<GenericProgressLog>({
    started: false,
    done: false,
    progress: 0,
    log: '',
  })
  const [unpackLogs, setUnpackLogs] = useState<GenericProgressLog>({
    started: false,
    done: false,
    progress: 0,
    log: '',
  })

  useEffect(() => {
    window.Installer.on(downloadChannel, (log: string) => {
      const parsed: GenericProgressLog = JSON.parse(log)
      setDownloadLogs(parsed)
      setLog(parsed.log)
    })

    if (unpackChannel)
      window.Installer.on(unpackChannel, (log: string) => {
        const parsed: GenericProgressLog = JSON.parse(log)
        setUnpackLogs(parsed)
        setLog(parsed.log)
      })
  }, [])

  return (
    <Grid container p={1}>
      <Grid item xs={9}>
        <Box display="flex">
          <Typography mr={0.5}>Point {title}</Typography>
          {unpackLogs.done && downloadLogs.done && (
            <CheckCircleIcon
              color="success"
              sx={{ height: 16, width: 16, mt: 0.2 }}
            />
          )}
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.6 }}>
          {log}
        </Typography>
      </Grid>
      <Grid item xs={3} display="flex">
        <Box position="relative" mr={1.25}>
          <CircularProgress
            variant={
              downloadLogs.started && !downloadLogs.progress
                ? 'indeterminate'
                : 'determinate'
            }
            value={Number(downloadLogs.progress)}
            size={32}
          />
          <Box position="absolute" top={6} left={6}>
            {downloadLogs.done ? (
              <FileDownloadDoneIcon fontSize="small" />
            ) : (
              <FileDownloadIcon fontSize="small" />
            )}
          </Box>
        </Box>
        {unpackChannel && (
          <Box position="relative">
            <CircularProgress
              variant={
                unpackLogs.started && !unpackLogs.progress
                  ? 'indeterminate'
                  : 'determinate'
              }
              value={Number(unpackLogs.progress)}
              size={32}
            />
            <Box position="absolute" top={6} left={6}>
              {unpackLogs.done ? (
                <FolderOpenIcon fontSize="small" />
              ) : (
                <FolderZipIcon fontSize="small" />
              )}
            </Box>
          </Box>
        )}
      </Grid>
    </Grid>
  )
}

export default DownloadExtractLogs
