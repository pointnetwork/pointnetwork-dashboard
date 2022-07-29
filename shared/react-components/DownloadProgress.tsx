// MUI
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
// Icons
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileDownloadDoneIcon from '@mui/icons-material/FileDownloadDone';
// Types
import {GenericProgressLog} from '../../src/@types/generic';

const DownloadProgress = ({downloadLogs}: {
  downloadLogs: GenericProgressLog
}) => (
    <Box position="relative" mr={1.25}>
        <CircularProgress
            variant={
                downloadLogs.started && !downloadLogs.progress
                    ? 'indeterminate'
                    : 'determinate'
            }
            color={downloadLogs.error ? 'error' : 'primary'}
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
);

export default DownloadProgress;
