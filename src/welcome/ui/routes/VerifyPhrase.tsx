import { useEffect, useState } from 'react'
// Material UI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
// Components
import MainLayout from '../components/MainLayout'
// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import SendIcon from '@mui/icons-material/Send'
// Types
import { WelcomeChannelsEnum } from '../../../@types/ipc_channels'

const VerifyPhrase = () => {
  const [isMatch, setIsMatch] = useState<boolean>(false)
  const [inputs, setInputs] = useState<string[]>([])
  const [words, setWords] = useState<{ word: string; idx: number }[]>([])

  useEffect(() => {
    window.Welcome.pickWords()

    window.Welcome.on(
      WelcomeChannelsEnum.pick_words,
      (_: { word: string; idx: number }[]) => {
        setWords(_)
      }
    )
  }, [])

  useEffect(() => {
    setIsMatch(
      inputs.map(_ => _.trim()).join('') ===
        words.map(el => el.word.trim()).join('')
    )
  }, [inputs, words])

  const handleChange = (e: any) => {
    setInputs(prev => {
      prev[e.target.name] = e.target.value
      return [...prev]
    })
  }

  const handleLogin = () => {
    window.Welcome.validateWords(inputs)

    window.Welcome.on(
      WelcomeChannelsEnum.validate_words,
      (result: boolean | string) => {
        if (result === true) {
          window.Welcome.login()
        }
      }
    )
  }

  return (
    <MainLayout>
      <Typography variant="h4" mt={12} mb={2}>
        Verify Secret Phrase
      </Typography>
      <Typography mb={1}>
        Enter the word that belongs to the number in the correct order
      </Typography>
      <Grid container spacing={2} mb={1}>
        {words.map((word, idx) => (
          <Grid item xs={4}>
            <TextField
              color={
                word.word.trim() === inputs[idx]?.trim() ? 'success' : 'error'
              }
              name={idx.toString()}
              value={inputs[idx]}
              label={`Word ${word.idx + 1}`}
              onChange={handleChange}
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
        <Typography
          variant="body2"
          color={isMatch ? 'success' : 'error'}
          ml={0.5}
        >
          Words {isMatch ? '' : 'do not'} match
        </Typography>
      </Box>
      <Button
        variant="contained"
        size="large"
        endIcon={<SendIcon />}
        onClick={handleLogin}
        disabled={!isMatch}
      >
        Confirm and Login
      </Button>
    </MainLayout>
  )
}

export default VerifyPhrase
