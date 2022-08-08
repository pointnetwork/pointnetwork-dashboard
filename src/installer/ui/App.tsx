import {useEffect, useRef, useState} from 'react';
// Material UI
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
// Components
import CreateDirLogs from './components/CreateDirLogs';
import DisclaimerDialog from './components/DisclaimerDialog';
import DisplayIdentifier from '../../../shared/react-components/DisplayIdentifier';
import DownloadExtractLogs from './components/DownloadExtractLogs';
import TopBar from './components/TopBar';
import SendIcon from '@mui/icons-material/Send';
import UIThemeProvider from '../../../shared/react-components/UIThemeProvider';
// Types
import {
    NodeChannelsEnum,
    FirefoxChannelsEnum,
    PointSDKChannelsEnum,
    UninstallerChannelsEnum,
    InstallerChannelsEnum
} from '../../@types/ipc_channels';
import DomIds from '../../@types/DOM-el-ids';

export default function App() {
    const loggerRef = useRef<HTMLElement>();
    const [disclaimerOpen, setDisclaimerOpen] = useState<boolean>(true);
    const [attempts, setAttempts] = useState<number>(0);
    const [installing, setInstalling] = useState<boolean>(false);
    const [version, setVersion] = useState<string>('');
    const [identifier, setIdentifier] = useState<string>('');

    const getInfo = async () => {
        const [dashboardVersion, id] = await Promise.all([
            window.Installer.getDashboardVersion(),
            window.Installer.getIdentifier()
        ]);
        setVersion(dashboardVersion);
        setIdentifier(id);
    };
    useEffect(() => {
        window.Installer.on(InstallerChannelsEnum.error, (_attempt: string) => {
            setAttempts(Number(_attempt));
        });
        window.Installer.once(PointSDKChannelsEnum.download, () => {
            loggerRef.current?.scrollTo({
                top: loggerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        });
        getInfo();
    }, []);

    function sendStartInstallation() {
        setAttempts(0);
        window.Installer.startInstallation();
        setInstalling(true);
    }

    return (
        <UIThemeProvider>
            <TopBar isLoading={false} />
            <DisplayIdentifier identifier={identifier} />
            <DisclaimerDialog open={disclaimerOpen} setOpen={setDisclaimerOpen} />

            <Box
                display={'flex'}
                flexDirection="column"
                sx={{p: '3.5%', overflow: 'hidden', maxHeight: '82vh'}}
            >
                <Box display="flex" alignItems="baseline">
                    <Typography variant="h4" gutterBottom component="h1" fontWeight="900">
                        {installing ? 'Installing' : 'Welcome to Point Installer'}
                    </Typography>
                    <Typography ml={1} color="#555555">
                        v{version}
                    </Typography>
                </Box>

                <Box flex={1} display={installing ? 'none' : 'block'}>
                    <Typography color="#cccccc">
                        The following components will be installed to run Point Network
                    </Typography>
                    <Box px={2} mt={2} mb={3} bgcolor="primary.light" borderRadius={2}>
                        <List>
                            <ListItemText>Point Engine</ListItemText>
                            <ListItemText>Point LiveProfile</ListItemText>
                            <ListItemText>Point SDK</ListItemText>
                            <ListItemText>Point Browser (Firefox)</ListItemText>
                            <ListItemText>Point Uninstaller</ListItemText>
                        </List>
                    </Box>
                    <Button
                        id={DomIds.installer.app.startInstallationButton}
                        variant="contained"
                        onClick={sendStartInstallation}
                    >
                        Start Installation &nbsp;
                        <SendIcon></SendIcon>
                    </Button>
                </Box>
                {attempts ? (
                    <Alert severity="error">
                        <Typography mb={1} variant="body2">
                            {attempts >= 5
                                ? `An error occurred during installation. Please quit and try installing again. Make sure you have a stable internet connection and use a VPN (if you can). If you're
        still facing issues, then please contact us. We'll be glad to help
        you out.`
                                : `An error occurred during installation. Please try again. Make sure you have a stable internet connection
                and use a VPN (if you can)`}
                        </Typography>
                        {attempts < 5 ? (
                            <Button
                                id={DomIds.installer.app.restartInstallationButton}
                                size="small"
                                color="error"
                                onClick={sendStartInstallation}
                                variant="contained"
                            >
                                Retry Installation
                            </Button>
                        ) : null}
                    </Alert>
                ) : null}
                <Box
                    ref={loggerRef}
                    sx={{p: '1rem', mt: '.5rem', overflowY: 'scroll'}}
                    bgcolor="primary.light"
                    borderRadius={2}
                    display={installing ? 'block' : 'none'}
                >
                    <CreateDirLogs
                        title="Create Directoires"
                        channel={InstallerChannelsEnum.create_dirs}
                    />
                    <CreateDirLogs
                        title="Clone Repositories"
                        channel={InstallerChannelsEnum.clone_repos}
                    />
                    <DownloadExtractLogs
                        title="Browser"
                        downloadChannel={FirefoxChannelsEnum.download}
                        unpackChannel={FirefoxChannelsEnum.unpack}
                    />
                    <DownloadExtractLogs
                        title="SDK Extenstion"
                        downloadChannel={PointSDKChannelsEnum.download}
                    />
                    <DownloadExtractLogs
                        title="Node"
                        downloadChannel={NodeChannelsEnum.download}
                        unpackChannel={NodeChannelsEnum.unpack}
                    />
                    <DownloadExtractLogs
                        title="Uninstaller"
                        downloadChannel={UninstallerChannelsEnum.download}
                        unpackChannel={UninstallerChannelsEnum.unpack}
                    />
                </Box>
            </Box>
        </UIThemeProvider>
    );
}
