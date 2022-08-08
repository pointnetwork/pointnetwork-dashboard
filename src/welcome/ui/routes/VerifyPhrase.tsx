import {Dispatch, SetStateAction, useEffect, useState} from 'react';
import WelcomeRoutes from './routes';
// Material UI
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
// Components
import MainLayout from '../components/MainLayout';
// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SendIcon from '@mui/icons-material/Send';
// Types
import {WelcomeChannelsEnum} from '../../../@types/ipc_channels';
import mnemonicWords from 'mnemonic-words';
import DomIds from '../../../@types/DOM-el-ids';

const VerifyPhrase = ({
    route,
    setRoute
}: {
    route: string;
    setRoute: Dispatch<SetStateAction<string>>;
}) => {
    if (route !== WelcomeRoutes.verify) return null;

    const [isMatch, setIsMatch] = useState<boolean>(false);
    const [inputs, setInputs] = useState<string[]>(Array(3).fill(''));
    const [words, setWords] = useState<{word: string; idx: number}[]>([]);

    useEffect(() => {
        window.Welcome.on(WelcomeChannelsEnum.pick_words, (_: {word: string; idx: number}[]) => {
            setWords(_);
        });

        window.Welcome.pickWords();
    }, []);

    useEffect(() => {
        setIsMatch(inputs.map(_ => _.trim()).join('') === words.map(el => el.word.trim()).join(''));
    }, [inputs, words]);

    const handleChange = (value: string, index: number) => {
        setInputs(prev => prev.map((item, idx) => (idx === index ? value.trim() : item)));
    };

    const handleLogin = () => {
        window.Welcome.validateWords(inputs);

        window.Welcome.on(WelcomeChannelsEnum.validate_words, (result: boolean | string) => {
            if (result === true) {
                window.Welcome.login();
            }
        });
    };

    return (
        <MainLayout navigate={() => setRoute(WelcomeRoutes.new)}>
            <Typography variant="h4" mt={12} mb={2}>
                Verify Secret Phrase
            </Typography>
            <Typography mb={5} color="#777777">
                Enter the words to make sure you saved them
            </Typography>
            <Grid container spacing={2} mb={1}>
                {words.map((word, idx) => (
                    <Grid item xs={4} key={idx}>
                        <Autocomplete
                            renderInput={params => (
                                <TextField
                                    {...params}
                                    color={
                                        word.word.trim() === inputs[idx]?.trim()
                                            ? 'success'
                                            : 'error'
                                    }
                                    label={
                                        `Word ${word.idx + 1}` +
                                        (word.idx + 1 === 12 ? ' (the last one)' : '')
                                    }
                                    onKeyDown={e => {
                                        if (e.key === ' ') {
                                            e.key = 'Enter';
                                        }
                                    }}
                                />
                            )}
                            id={`input_${idx}`}
                            autoHighlight
                            autoSelect
                            forcePopupIcon={false}
                            filterOptions={(options, {inputValue}) =>
                                options.filter(
                                    option => inputValue && option.startsWith(inputValue)
                                )
                            }
                            options={mnemonicWords}
                            value={inputs[idx] || null}
                            onChange={(e, newValue) => {
                                handleChange(newValue ?? '', idx);
                            }}
                        />
                    </Grid>
                ))}
            </Grid>
            <Box display="flex" alignItems="center" mb={3}>
                {isMatch ? (
                    <CheckCircleIcon fontSize="small" color="success" />
                ) : (
                    <ErrorIcon fontSize="small" color="error" />
                )}
                <Typography variant="body2" color={isMatch ? 'success' : 'error'} ml={0.5}>
                    {'Words' + (isMatch ? '' : ' do not') + ' match'}
                </Typography>
            </Box>
            <Button
                id={DomIds.welcome.verifyPhrase.loginButton}
                variant="contained"
                size="large"
                endIcon={<SendIcon />}
                onClick={handleLogin}
                disabled={!isMatch}
            >
                Confirm and Login
            </Button>
        </MainLayout>
    );
};

export default VerifyPhrase;
