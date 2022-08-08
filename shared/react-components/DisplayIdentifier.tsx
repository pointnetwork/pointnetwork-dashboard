import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const DisplayIdentifier = ({identifier}: {identifier: string}) => (
    <Box position="fixed" right={8} bottom={2}>
        <Typography variant="caption" fontFamily="monospace" color="#888">
            Support ID: {identifier}
        </Typography>
    </Box>
);

export default DisplayIdentifier;
