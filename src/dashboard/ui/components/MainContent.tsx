import {ReactElement, useContext, useEffect, useState} from 'react';
// MUI
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
// Context
import {MainStatusContext} from '../../context/MainStatusContext';
// Components
import TopBar from './TopBar';
import DashboardTitle from './DashboardTitle';
// Icons
import CircleIcon from '@mui/icons-material/Circle';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
// Types
import {GenericChannelsEnum} from '../../../@types/ipc_channels';

const ResourceStatusCard = ({
    resource,
    isRunning,
    version,
    onRetry
}: {
  resource: 'Engine' | 'Browser' | 'Extension'
  isRunning: boolean
  version: string
  onRetry?: () => void
}) => (
    <Paper elevation={4} variant="outlined" sx={{my: 1}}>
        <Box px={2} py={1.5} display="flex" alignItems="center">
            {isRunning ? (
                <CircleIcon sx={{height: 16, width: 16}} color="success" />
            ) : (
                <CircleIcon sx={{height: 16, width: 16}} color="error" />
            )}
            <Box px={2} flex={1}>
                <Typography variant="h6" mb={-0.4}>
            Point {resource}
                </Typography>
                <Typography variant="body2" sx={{opacity: 0.7}}>
            Status: {isRunning ? 'Running' : 'Stopped'}
                </Typography>
            </Box>
            <Chip
                label={isRunning || !onRetry ? version : 'Launch'}
                color={isRunning || !onRetry ? 'default' : 'primary'}
                onClick={isRunning ? undefined : onRetry}
            />
        </Box>
    </Paper>
);

const InfoDisplayCard = ({
    title,
    children
}: {
  title: string
  children: ReactElement | ReactElement[]
}) => (
    <Paper elevation={4} variant="outlined" sx={{my: 1}}>
        <Box p={1.5} position="relative">
            <Typography variant="body2" mb={0.5} sx={{opacity: 0.7}}>
                {title}
            </Typography>
            {children}
        </Box>
    </Paper>
);

const MainContent = () => {
    const [alert, setAlert] = useState<string>('');

    const {
        isBrowserRunning,
        isNodeRunning,
        browserVersion,
        nodeVersion,
        sdkVersion,
        balance,
        identityInfo
    } = useContext(MainStatusContext);

    useEffect(() => {
        window.Dashboard.on(GenericChannelsEnum.copy_to_clipboard, () => {
            setAlert('Copied');
        });
    }, []);

    const copyWalletAddress = () =>
        window.Dashboard.copyToClipboard(identityInfo.address);

    return (
        <Grid item xs={11}>
            <Snackbar
                open={Boolean(alert)}
                message={alert}
                autoHideDuration={3000}
                onClose={() => setAlert('')}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            />

            <TopBar isBrowserRunning={isBrowserRunning} />
            <Box p={4}>
                <DashboardTitle />

                <Grid container columnSpacing={3} mt={2}>
                    <Grid item xs={6}>
                        <Typography variant="body2" mb={0.3}>
              Resources
                        </Typography>
                        <Divider />
                        <ResourceStatusCard
                            resource="Engine"
                            isRunning={isNodeRunning}
                            version={nodeVersion}
                        />
                        <ResourceStatusCard
                            resource="Browser"
                            isRunning={isBrowserRunning}
                            version={browserVersion}
                            onRetry={window.Dashboard.launchBrowser}
                        />
                        <ResourceStatusCard
                            resource="Extension"
                            isRunning={isBrowserRunning}
                            version={sdkVersion}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <Typography variant="body2" mb={0.3}>
              Account Information
                        </Typography>
                        <Divider />
                        <InfoDisplayCard title="Account">
                            <Box display="flex" alignItems="center" mb={1}>
                                <AccountCircleIcon fontSize="large" />
                                <Box ml={1}>
                                    <Typography variant="h6">
                                        {identityInfo.identity || 'Not registered yet'}
                                    </Typography>
                                    <Tooltip title="Click to copy your address">
                                        <Typography
                                            variant="caption"
                                            sx={{overflowWrap: 'anywhere', cursor: 'pointer'}}
                                            onClick={copyWalletAddress}
                                        >
                                            {identityInfo.address || 'Not Available'}
                                        </Typography>
                                    </Tooltip>
                                </Box>
                            </Box>
                        </InfoDisplayCard>
                        <InfoDisplayCard title="Balance">
                            <Typography variant="h6" mb={1}>
                                {balance} xPOINT
                            </Typography>
                            <Button variant="contained" size="small" disabled={balance > 0}>
                Request xPOINTS
                            </Button>
                        </InfoDisplayCard>
                    </Grid>
                </Grid>
            </Box>
        </Grid>
    );
};

export default MainContent;
