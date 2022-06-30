// MUI
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
// Icons
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import FolderZipIcon from '@mui/icons-material/FolderZip'
// Types
import { GenericProgressLog } from '../../src/@types/generic'

const UnpackProgress = ({ unpackLogs }: { unpackLogs: GenericProgressLog }) => {
  return (
    <Box position="relative">
      <CircularProgress
        variant={
          unpackLogs.started && !unpackLogs.progress
            ? 'indeterminate'
            : 'determinate'
        }
        color={unpackLogs.error ? 'error' : 'primary'}
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
  )
}

export default UnpackProgress
