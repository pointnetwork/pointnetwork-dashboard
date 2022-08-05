import {FunctionComponent} from 'react';
// MUI
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
// Components
import ContactSupport from './ContactSupport';

const TimeoutAlert: FunctionComponent<{
    identifier: string;
    open: boolean;
}> = ({identifier, open}) => (
    <Dialog open={open}>
        <Box p={3}>
            <Typography>
                Failed to start Point Network. Please, close and reopen Point Dashboard.
            </Typography>
            <ContactSupport identifier={identifier} />
            <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                    id="launch-uninstaller-button"
                    color="error"
                    variant="outlined"
                    size="small"
                    onClick={window.Dashboard.launchUninstaller}
                >
                    Uninstall
                </Button>
                <Button
                    id="launch-node-button"
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ml: 1}}
                    onClick={window.Dashboard.launchNode}
                >
                    Retry
                </Button>
                <Button
                    id="close-button"
                    color="error"
                    variant="contained"
                    size="small"
                    sx={{ml: 1}}
                    onClick={window.Dashboard.closeWindow}
                >
                    Close
                </Button>
            </Box>
        </Box>
    </Dialog>
);

export default TimeoutAlert;
