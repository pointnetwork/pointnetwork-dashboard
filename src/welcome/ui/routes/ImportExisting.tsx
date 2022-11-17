import {Dispatch, SetStateAction, useEffect, useState} from 'react';
import mnemonicWords from 'mnemonic-words';
import WelcomeRoutes from './routes';
// Material UI
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
// Components
import MainLayout from '../components/MainLayout';
// Icons
import SendIcon from '@mui/icons-material/Send';
// Types
import {WelcomeChannelsEnum} from '../../../@types/ipc_channels';
import DomIds from '../../../@types/DOM-el-ids';

const ImportExisting = ({
    route,
    setRoute
}: {
    route: string;
    setRoute: Dispatch<SetStateAction<string>>;
}) => {
    if (route !== WelcomeRoutes.existing) return null;

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [secretPhrase, setSecretPhrase] = useState<string[]>(Array(12).fill(''));
    // Focusing the next input after filling the word
    useEffect(() => {
        const filledPhraseLength = secretPhrase.filter(word => Boolean(word)).length;
        if (filledPhraseLength > 0 && filledPhraseLength < 12) {
            document.getElementById(`input_${filledPhraseLength}`)?.focus();
        }
    }, [secretPhrase]);

    const handlePasteWholePhrase = (phrase: string) => {
        const words = phrase.split(' ');
        if (words.length !== 12) {
            setError('The text in your clipboard doesn’t seem to be a secret phrase');
            return;
        }
        setError('');
        setSecretPhrase(words);
    };
    useEffect(() => {
        window.Welcome.on(WelcomeChannelsEnum.paste_mnemonic, handlePasteWholePhrase);
    }, []);

    const handleChange = (value: string, index: number) => {
        setSecretPhrase(prev => prev.map((item, idx) => (idx === index ? value.trim() : item)));
    };

    const handleConfirmAndLogin = () => {
        setLoading(true);
        const words = secretPhrase.map(w => w.trim());
        const seed = words.join(' ');
        window.Welcome.validateMnemonic(seed);

        window.Welcome.on(WelcomeChannelsEnum.validate_mnemonic, (result: string | boolean) => {
            if (result === true) {
                window.Welcome.login();
            } else {
                setLoading(false);
                setError(result.toString());
            }
        });

        window.Welcome.on(WelcomeChannelsEnum.login, () => setLoading(false));
    };

    return (
        <MainLayout navigate={() => setRoute(WelcomeRoutes.home)}>
            <Grid container mb={1.5}>
                {error && (
                    <Grid item xs={12} mb={-1} mt={-1}>
                        <Alert severity="error">{error}</Alert>
                    </Grid>
                )}
                <Grid item xs={10} mt={3}>
                    <Typography variant="h4" mb={3}>
                        Log In
                    </Typography>
                    <Typography color="#999">Please enter your secret phrase</Typography>
                </Grid>
                <Grid item xs={2} mt={3}>
                    <Button
                        id={DomIds.welcome.importExisting.pasteSeedPhraseButton}
                        variant="outlined"
                        color="inherit"
                        onClick={window.Welcome.pasteMnemonic}
                        sx={{ml: 5}}
                    >
                        Paste
                    </Button>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                {secretPhrase.map((word, index) => (
                    <Grid item xs={3} key={index}>
                        <Autocomplete
                            renderInput={params => (
                                <TextField
                                    {...params}
                                    label={index + 1}
                                    // Because of useEffect, pressing tab leads to losing focus.
                                    // Also, we want to handle space press same as Tab or Enter.
                                    // This is the hacky way to achieve it
                                    onKeyDown={e => {
                                        if (e.key === 'Tab' || e.key === ' ') {
                                            e.key = 'Enter';
                                        } else if (
                                            e.key === 'Backspace' &&
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            (e.target as any).value.length === 0 &&
                                            index > 0
                                        ) {
                                            // Move focus to previous field
                                            e.preventDefault();
                                            document.getElementById(`input_${index - 1}`)?.focus();
                                        }
                                    }}
                                    onChange={e => {
                                        if (e.target.value.split(' ').length === 12) {
                                            handlePasteWholePhrase(e.target.value);
                                        }
                                    }}
                                />
                            )}
                            id={`input_${index}`}
                            autoHighlight
                            autoSelect
                            forcePopupIcon={false}
                            filterOptions={(options, {inputValue}) =>
                                options.filter(
                                    option => inputValue && option.startsWith(inputValue)
                                )
                            }
                            options={mnemonicWords}
                            value={word || null}
                            onChange={(e, newValue) => {
                                handleChange(newValue ?? '', index);
                            }}
                            disabled={index !== 0 && !secretPhrase[index - 1]}
                        />
                    </Grid>
                ))}
            </Grid>
            <Box mt={4}>
                <Button
                    id={DomIds.welcome.importExisting.loginButton}
                    variant="contained"
                    size="large"
                    disabled={secretPhrase.some(e => !e) || loading}
                    endIcon={<SendIcon />}
                    onClick={handleConfirmAndLogin}
                >
                    {loading ? 'Logging In...' : 'Confirm & Login'}
                </Button>
            </Box>
        </MainLayout>
    );
};

export default ImportExisting;
