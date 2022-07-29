import {ReactEventHandler, useState} from 'react';
// MUI
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
// Icons
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import HelpIcon from '@mui/icons-material/Help';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import {ReactComponent as PointLogo} from '../../../../assets/point-logo.svg';

const Sidebar = () => {
    const [logoutDialogOpen, setLogoutDialogOpen] = useState<boolean>(false);
    const [anchorElSettings, setAnchorElSettings] = useState<null | (EventTarget & Element)>(null);
    const [anchorElHelp, setAnchorElHelp] = useState<null | (EventTarget & Element)>(null);

    const isSettingsMenuOpen = Boolean(anchorElSettings);
    const isHelpMenuOpen = Boolean(anchorElHelp);

    const openSettingsMenu: ReactEventHandler = event => {
        setAnchorElSettings(event.currentTarget);
    };
    const closeSettingsMenu = () => {
        setAnchorElSettings(null);
    };

    const openHelpMenu: ReactEventHandler = event => {
        setAnchorElHelp(event.currentTarget);
    };
    const closeHelpMenu = () => {
        setAnchorElHelp(null);
    };

    const handleLogout = () => {
        window.Dashboard.logOut();
        setLogoutDialogOpen(false);
    };

    return (
        <Grid
            item
            xs={1}
            bgcolor="primary.light"
            p={1}
            py={2}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="space-between"
        >
            <Box flex={1} sx={{'-webkit-app-region': 'drag'}}>
                <Box height={40} width={40}>
                    <PointLogo />
                </Box>
            </Box>
            <Stack spacing={1}>
                <IconButton onClick={openHelpMenu}>
                    <HelpIcon />
                </IconButton>
                <IconButton onClick={openSettingsMenu}>
                    <SettingsIcon />
                </IconButton>
                <IconButton onClick={() => setLogoutDialogOpen(true)}>
                    <LogoutIcon />
                </IconButton>
            </Stack>

            <Menu
                anchorEl={anchorElSettings}
                open={isSettingsMenuOpen}
                onClose={closeSettingsMenu}
                PaperProps={{
                    sx: {
                        ml: 5,
                        mt: -5
                    }
                }}
            >
                <MenuItem onClick={window.Dashboard.launchUninstaller}>
                    <CancelPresentationIcon sx={{mr: 0.8, opacity: 0.7}} />
                    Uninstall
                </MenuItem>
            </Menu>

            <Menu
                anchorEl={anchorElHelp}
                open={isHelpMenuOpen}
                onClose={closeHelpMenu}
                PaperProps={{
                    sx: {
                        ml: 5,
                        mt: -5
                    }
                }}
            >
                <MenuItem
                    onClick={() =>
                        window.Dashboard.openExternalLink('https://pointnetwork.io/support')
                    }
                >
                    <HelpIcon sx={{mr: 0.8, opacity: 0.7}} />
                    Help & Feedback
                </MenuItem>
            </Menu>

            <Dialog open={logoutDialogOpen}>
                <Box p={3}>
                    <Typography>Are you sure you want to log out?</Typography>
                    <Box display="flex" justifyContent="flex-end" mt={2}>
                        <Button
                            color="inherit"
                            variant="outlined"
                            size="small"
                            onClick={() => setLogoutDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="error"
                            variant="contained"
                            size="small"
                            sx={{ml: 1}}
                            onClick={handleLogout}
                        >
                            Log Out
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Grid>
    );
};

export default Sidebar;
