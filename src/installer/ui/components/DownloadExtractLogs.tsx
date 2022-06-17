import { useEffect, useState } from 'react'
// MUI
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
// Icons
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import FileDownloadDoneIcon from '@mui/icons-material/FileDownloadDone'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import FolderZipIcon from '@mui/icons-material/FolderZip'
// Types
import {
  FirefoxChannelsEnum,
  NodeChannelsEnum,
} from '../../../@types/ipc_channels'
import { DownloadLog, UnpackLog } from '../../../@types/generic'

const DownloadExtractLogs = ({
  downloadChannel,
  unpackChannel,
}: {
  downloadChannel: NodeChannelsEnum.download | FirefoxChannelsEnum.download
  unpackChannel: NodeChannelsEnum.unpack | FirefoxChannelsEnum.unpack
}) => {
  const [log, setLog] = useState<string>('Waiting')
  const [downloadLogs, setDownloadLogs] = useState<DownloadLog>({
    isDownloading: false,
    isDownloaded: false,
    progress: 0,
    log: '',
  })
  const [unpackLogs, setUnpackLogs] = useState<UnpackLog>({
    isUnpacking: false,
    isUnpacked: false,
    progress: 0,
    log: '',
  })

  useEffect(() => {
    window.Installer.on(downloadChannel, (log: string) => {
      const parsed: DownloadLog = JSON.parse(log)
      setDownloadLogs(parsed)
      setLog(parsed.log)
    })

    window.Installer.on(unpackChannel, (log: string) => {
      const parsed: UnpackLog = JSON.parse(log)
      setUnpackLogs(parsed)
      setLog(parsed.log)
    })
  }, [])

  return (
    <Grid container>
      <Grid item xs={9}>
        <Typography>Point Node</Typography>
        <Typography variant="caption">{log}</Typography>
      </Grid>
      <Grid item xs={3} display="flex">
        <Box position="relative" mr={1.25}>
          <CircularProgress
            variant={
              downloadLogs.isDownloading && !downloadLogs.progress
                ? 'indeterminate'
                : 'determinate'
            }
            value={Number(downloadLogs.progress)}
            size={32}
          />
          <Box position="absolute" top={6} left={6}>
            {downloadLogs.isDownloaded ? (
              <FileDownloadDoneIcon fontSize="small" />
            ) : (
              <FileDownloadIcon fontSize="small" />
            )}
          </Box>
        </Box>
        <Box position="relative">
          <CircularProgress
            variant={
              unpackLogs.isUnpacking && !unpackLogs.progress
                ? 'indeterminate'
                : 'determinate'
            }
            value={Number(unpackLogs.progress)}
            size={32}
          />
          <Box position="absolute" top={6} left={6}>
            {unpackLogs.isUnpacked ? (
              <FolderOpenIcon fontSize="small" />
            ) : (
              <FolderZipIcon fontSize="small" />
            )}
          </Box>
        </Box>
      </Grid>
    </Grid>
  )
}

export default DownloadExtractLogs
