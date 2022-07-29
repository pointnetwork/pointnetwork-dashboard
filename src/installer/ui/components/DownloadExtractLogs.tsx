import {useEffect, useState} from 'react';
// MUI
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
// Components
import DownloadProgress from '../../../../shared/react-components/DownloadProgress';
import UnpackProgress from '../../../../shared/react-components/UnpackProgress';
// Types
import {
    FirefoxChannelsEnum,
    NodeChannelsEnum,
    PointSDKChannelsEnum,
    UninstallerChannelsEnum
} from '../../../@types/ipc_channels';
import {GenericProgressLog} from '../../../@types/generic';

const DownloadExtractLogs = ({
    title,
    downloadChannel,
    unpackChannel
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
    const [log, setLog] = useState<string>('Waiting...');
    const [downloadLogs, setDownloadLogs] = useState<GenericProgressLog>({
        started: false,
        done: false,
        progress: 0,
        log: '',
        error: false
    });
    const [unpackLogs, setUnpackLogs] = useState<GenericProgressLog>({
        started: false,
        done: false,
        progress: 0,
        log: '',
        error: false
    });

    useEffect(() => {
        window.Installer.on(downloadChannel, (_log: string) => {
            const parsed: GenericProgressLog = JSON.parse(_log);
            setDownloadLogs(parsed);
            setLog(parsed.log);
        });

        if (unpackChannel) {
            window.Installer.on(unpackChannel, (_log: string) => {
                const parsed: GenericProgressLog = JSON.parse(_log);
                setUnpackLogs(parsed);
                setLog(parsed.log);
            });
        }
    }, []);

    return (
        <Grid container p={1}>
            <Grid item xs={9}>
                <Box display="flex">
                    <Typography mr={0.5}>Point {title}</Typography>
                    {(downloadLogs.error || unpackLogs.error) && (
                        <ErrorIcon color="error" sx={{height: 16, width: 16, mt: 0.2}} />
                    )}
                    {(!unpackChannel || unpackLogs.done) && downloadLogs.done && (
                        <CheckCircleIcon
                            color="success"
                            sx={{height: 16, width: 16, mt: 0.2}}
                        />
                    )}
                </Box>
                <Typography variant="body2" sx={{opacity: 0.6}}>
                    {log}
                </Typography>
            </Grid>
            <Grid item xs={3} display="flex">
                <DownloadProgress downloadLogs={downloadLogs} />
                {unpackChannel && <UnpackProgress unpackLogs={unpackLogs} />}
            </Grid>
        </Grid>
    );
};

export default DownloadExtractLogs;
