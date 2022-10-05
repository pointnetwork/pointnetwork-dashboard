import {Dispatch, SetStateAction, useEffect, useState} from 'react';
import WelcomeRoutes from './routes';
// Material UI
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
// Components
import MainLayout from '../components/MainLayout';
// Icons
import SendIcon from '@mui/icons-material/Send';
// Types
import {WelcomeChannelsEnum} from '../../../@types/ipc_channels';
import DomIds from '../../../@types/DOM-el-ids';

const GenerateNew = ({
    route,
    setRoute
}: {
    route: string;
    setRoute: Dispatch<SetStateAction<string>>;
}) => {
    if (route !== WelcomeRoutes.new) return null;

    const [alert, setAlert] = useState<string>('');
    const [secretPhrase, setSecretPhrase] = useState<string[]>(Array(12).fill(''));

    useEffect(() => {
        window.Welcome.getMnemonic();

        window.Welcome.on(WelcomeChannelsEnum.get_mnemonic, (phrase: string) => {
            if (phrase) {
                setSecretPhrase(phrase.split(' '));
            }
        });

        window.Welcome.on(WelcomeChannelsEnum.generate_mnemonic, (phrase: string) => {
            setSecretPhrase(phrase.split(' '));
        });

        window.Welcome.on(WelcomeChannelsEnum.copy_mnemonic, () => {
            setAlert('Copied');
            setTimeout(() => setAlert(''), 3000);
        });
    }, []);

    return (
        <MainLayout navigate={() => setRoute(WelcomeRoutes.home)}>
            <Snackbar
                open={Boolean(alert)}
                message={alert}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            />
            <Typography variant="h4" mt={3} mb={2}>
                Generate Secret Phrase
            </Typography>
            <Grid container spacing={3}>
                <Grid item sx={{width: '100%'}}>
                    <Alert severity="info">
                        <AlertTitle>
                            <Typography fontWeight="bold">IMPORTANT</Typography>
                        </AlertTitle>
                        <Typography mt={-0.7} variant="body2">
                            Never share your secret phrase with anyone! Write down and keep it in a
                            secure place
                        </Typography>
                    </Alert>

                    <Box
                        border="2px dashed #555"
                        sx={{backgroundColor: '#111111'}}
                        color="#ff8800"
                        borderRadius={3}
                        mt={2}
                        px={2.5}
                        py={1.5}
                    >
                        <Grid container>
                            {secretPhrase.map((word, idx) => (
                                <Grid item xs={2} py={1.5} key={idx}>
                                    <Typography>
                                        <span style={{borderBottom: '1px solid #333333'}}>
                                            {word}
                                        </span>
                                    </Typography>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Grid>
                <Grid item width="100%">
                    <Box mt={1.5} mb={6.5} width="100%">
                        <Typography mb={1.5}>
                            Click "Generate" to generate a new secret phrase
                        </Typography>
                        <Button
                            id={DomIds.welcome.generateNew.generateSeedPhraseButton}
                            variant={secretPhrase.some(el => !el) ? 'contained' : 'outlined'}
                            sx={{mr: 1.5}}
                            onClick={window.Welcome.generateMnemonic}
                        >
                            Generate
                        </Button>
                        <Button
                            id={DomIds.welcome.generateNew.copySeedPhraseButton}
                            variant="outlined"
                            onClick={() => window.Welcome.copyMnemonic(secretPhrase.join(' '))}
                            disabled={secretPhrase.some(el => !el)}
                        >
                            Copy
                        </Button>

                        <Button
                            id={DomIds.welcome.generateNew.continueSeedVerificationButton}
                            variant="contained"
                            // size="large"
                            endIcon={<SendIcon />}
                            // fullWidth
                            onClick={() => setRoute(WelcomeRoutes.verify)}
                            disabled={secretPhrase.some(el => !el)}
                            sx={{float: 'right'}}
                        >
                            Continue
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </MainLayout>
    );
};

export default GenerateNew;
