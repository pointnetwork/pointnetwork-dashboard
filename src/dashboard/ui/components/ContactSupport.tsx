import {useState, useEffect} from 'react';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {GenericChannelsEnum} from '../../../@types/ipc_channels';
import ExternalLink from '../../../../shared/react-components/ExternalLink';
import DomIds from '../../../@types/DOM-el-ids';

type Props = {identifier: string};

const ContactSupport = ({identifier}: Props) => {
    const [copied, setCopied] = useState<boolean>(false);

    useEffect(() => {
        window.Dashboard.on(GenericChannelsEnum.copy_to_clipboard, () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        });
    }, []);

    return (
        <Box py={3}>
            <Typography>
                If the problem persists, please try to uninstall and reinstall the Dashboard or
                contact the support team{' '}
                <ExternalLink
                    id={DomIds.dashboard.contactSupport.supportLink}
                    onClick={() =>
                        window.Dashboard.openExternalLink('https://pointnetwork.io/support')
                    }
                >
                    here
                </ExternalLink>{' '}
                with your support ID -{' '}
            </Typography>
            <Box display="flex" alignItems="center" mt={1}>
                <Chip label={identifier} sx={{mr: 0.5}} />
                {copied ? (
                    <Box display="flex" alignItems="center">
                        <IconButton>
                            <CheckIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2">Copied!</Typography>
                    </Box>
                ) : (
                    <Box display="flex" alignItems="center">
                        <IconButton
                            id={DomIds.dashboard.contactSupport.copyIdentifierButton}
                            onClick={() => window.Dashboard.copyToClipboard(identifier)}
                        >
                            <ContentCopyIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2">Click to Copy</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ContactSupport;
