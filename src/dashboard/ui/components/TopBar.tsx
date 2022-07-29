import {useState} from 'react';
// MUI
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
// Icons
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';

const TopBar = ({isBrowserRunning = true}: { isBrowserRunning: boolean }) => {
    const [closeDialogOpen, setCloseDialogOpen] = useState<boolean>(false);

    const handleCloseRequest = () => {
        if (isBrowserRunning) setCloseDialogOpen(true);
        else handleClose();
    };

    const handleClose = () => {
        window.Dashboard.closeWindow();
        setCloseDialogOpen(false);
    };

    return (
        <Box
            display="flex"
            justifyContent="flex-end"
            sx={{left: '2px', position: 'relative', top: '-2px'}}
        >
            <Box flex={1} sx={{'-webkit-app-region': 'drag'}}></Box>
            <Box
                sx={{
                    'opacity': 0.4,
                    'transition': 'all 150ms',
                    '&:hover': {opacity: 1},
                    '&:active': {opacity: 0.5}
                }}
            >
                <Box
                    px=".75rem"
                    py=".25rem"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    bgcolor="primary.light"
                    sx={{cursor: 'pointer'}}
                    onClick={window.Dashboard.minimizeWindow}
                >
                    <RemoveIcon fontSize="small" />
                </Box>
            </Box>
            <Box
                sx={{
                    'opacity': 0.4,
                    'transition': 'all 150ms',
                    '&:hover': {opacity: 1},
                    '&:active': {opacity: 0.5}
                }}
            >
                <Box
                    px=".75rem"
                    py=".25rem"
                    bgcolor="red"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    sx={{cursor: 'pointer'}}
                    onClick={handleCloseRequest}
                >
                    <CloseIcon fontSize="small" sx={{color: 'white'}} />
                </Box>
            </Box>

            <Dialog open={closeDialogOpen}>
                <Box p={3}>
                    <Typography>Quit Point Network and Point Browser?</Typography>
                    <Box display="flex" justifyContent="flex-end" mt={2}>
                        <Button
                            color="inherit"
                            variant="outlined"
                            size="small"
                            onClick={() => setCloseDialogOpen(false)}
                        >
              Cancel
                        </Button>
                        <Button
                            color="error"
                            variant="contained"
                            size="small"
                            sx={{ml: 1}}
                            onClick={handleClose}
                        >
              Quit
                        </Button>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
};

export default TopBar;
