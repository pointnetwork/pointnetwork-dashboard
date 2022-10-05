import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ContactSupport from './ContactSupport';
import DomIds from '../../../@types/DOM-el-ids';

// TODO: this will come from a shared repo of `point-error-codes`.
type PointErr = {code: number; name: string; text: string};
const PointErrorCodes: Record<number, PointErr> = {
    11: {
        code: 11,
        name: 'INVALID_KEYFILE',
        text: 'Keyfile has missing or invalid data.'
    },
    12: {
        code: 12,
        name: 'LOCKFILE_PRESENT',
        text: 'Unable to create lockfile, process must be already running.'
    },
    13: {
        code: 13,
        name: 'DDBB_FAILED_MIGRATION',
        text: 'Failed to run database migrations.'
    },
    14: {
        code: 14,
        name: 'INVALID_CHECKSUM',
        text: 'Checksum for downloaded file does not match the expected one.'
    }
};

function getButtonByError(code: number) {
    if (code === 11) {
        return (
            <Button
                id={DomIds.dashboard.errorDialog.logoutButton}
                color="primary"
                variant="contained"
                size="small"
                onClick={window.Dashboard.logOut}
            >
                Log Out
            </Button>
        );
    }

    if (code === 12 || code === 13 || code === 14) {
        return (
            <Button
                id={DomIds.dashboard.errorDialog.closeButton}
                color="error"
                variant="contained"
                size="small"
                onClick={window.Dashboard.closeWindow}
            >
                Close
            </Button>
        );
    }

    return null;
}

function getInstructionsByError(code: number) {
    if (code === 11) {
        return (
            <Typography>
                If you have manually edited `key.json`, you may fix it and restart the Point
                Dashboard. Otherwise, click on the button below to log out and create a new account
                or import an existing one.
            </Typography>
        );
    }

    if (code === 14) {
        return (
            <Typography>
                Please make sure your network is working correctly. Close the Dashboard and restart
                it to trigger a new download.
            </Typography>
        );
    }

    return null;
}

type Props = {
    errCode: number;
    identifier: string;
};

const ErrorDialog = ({errCode, identifier}: Props) => {
    const pointErr = PointErrorCodes[errCode];

    if (!pointErr) return null;

    return (
        <Dialog open={errCode > 0}>
            <Box p={3}>
                <Typography variant="h5" gutterBottom>
                    Sorry, we have run into an error.
                </Typography>

                <Box bgcolor="#262626" border={1} borderColor="#555" borderRadius={1} my={2} p={2}>
                    <Typography>
                        {pointErr.name}: {pointErr.text}
                    </Typography>
                </Box>

                {getInstructionsByError(errCode)}

                <ContactSupport identifier={identifier} />

                <Box display="flex" justifyContent="flex-end" mt={2}>
                    {getButtonByError(errCode)}
                </Box>
            </Box>
        </Dialog>
    );
};

export default ErrorDialog;
