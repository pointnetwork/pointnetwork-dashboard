import {Dispatch, ReactEventHandler, SetStateAction} from 'react';
import WelcomeRoutes from './routes';
// Material UI
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import deepPurple from '@mui/material/colors/deepPurple';
// Icons
import DownloadIcon from '@mui/icons-material/Download';
import KeyIcon from '@mui/icons-material/Key';
import DomIds from '../../../@types/DOM-el-ids';

const Home = ({route, setRoute}: {route: string; setRoute: Dispatch<SetStateAction<string>>}) => {
    if (route !== WelcomeRoutes.home) return null;

    return (
        <Container maxWidth="sm">
            <Typography variant="h5" mt={16}>
                Do you already have a web3 secret phrase?
            </Typography>
            <Typography variant="body2" color="#aaaaaa">
                12 words that give you access to your account
            </Typography>
            <Box width="560px">
                <Grid container pt={2.5}>
                    <ClickableCard
                        id={DomIds.welcome.home.generateNewCard}
                        isDefault={true}
                        setRoute={() => setRoute(WelcomeRoutes.new)}
                        icon={<KeyIcon sx={{height: 64, width: 64}} />}
                    >
                        No, generate one
                    </ClickableCard>
                    <ClickableCard
                        id={DomIds.welcome.home.importExistingCard}
                        setRoute={() => setRoute(WelcomeRoutes.existing)}
                        icon={<DownloadIcon sx={{height: 64, width: 64}} />}
                    >
                        Yes, I have it
                    </ClickableCard>
                </Grid>
            </Box>
        </Container>
    );
};

export default Home;

const ClickableCard = ({
    id,
    icon,
    children,
    setRoute,
    isDefault = false
}: {
    id: string;
    icon: JSX.Element;
    children: string;
    setRoute: ReactEventHandler;
    isDefault?: boolean;
}) => (
    <Grid item xs={6} p={1}>
        <Box
            id={id}
            border={3}
            borderRadius={3}
            p={3}
            borderColor="#ddd"
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            sx={{
                backgroundColor: isDefault ? '#29244b' : 'inherit',
                transition: 'all .2s',
                cursor: 'pointer',
                '&:hover': {
                    color: ' white',
                    background: deepPurple.A200,
                    borderColor: deepPurple.A700
                },
                '&:active': {
                    color: ' white',
                    background: deepPurple.A700
                }
            }}
            onClick={setRoute}
        >
            {icon}
            <Typography variant="h6" textAlign="center" mt={1} lineHeight={1.5}>
                {children}
            </Typography>
        </Box>
    </Grid>
);
