import {ReactElement, ReactEventHandler} from 'react';
// MUI
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const MainLayout = ({
    children,
    navigate
}: {
  navigate: ReactEventHandler
  children: ReactElement | ReactElement[]
}) => (
    <Box>
        <Box pl={2}>
            <IconButton onClick={navigate}>
                <ArrowBackIcon />
            </IconButton>
        </Box>
        <Container maxWidth="md">
            <Box px={10}>{children}</Box>
        </Container>
    </Box>
);

export default MainLayout;
