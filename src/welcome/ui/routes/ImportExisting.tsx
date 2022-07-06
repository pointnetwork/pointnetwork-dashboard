import { useEffect, useState } from 'react'
// Material UI
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
// Components
import MainLayout from '../components/MainLayout'
// Icons
import SendIcon from '@mui/icons-material/Send'
// Types
import { WelcomeChannelsEnum } from '../../../@types/ipc_channels'

const ImportExisting = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [secretPhrase, setSecretPhrase] = useState<string[]>(Array(12).fill(''))

  useEffect(() => {
    window.Welcome.on(WelcomeChannelsEnum.paste_mnemonic, (phrase: string) => {
      const words = phrase.split(' ')
      if (words.length !== 12) return setError('Invalid seed length')
      setError('')
      setSecretPhrase(words)
    })
  }, [])

  const handleChange = (e: any) => {
    setSecretPhrase(prev => {
      prev[Number(e.target.name)] = e.target.value.trim()
      return [...prev]
    })
  }

  const handleConfirmAndLogin = () => {
    setLoading(true)
    const words = secretPhrase.map(w => w.trim())
    const seed = words.join(' ')
    window.Welcome.validateMnemonic(seed)

    window.Welcome.on(
      WelcomeChannelsEnum.validate_mnemonic,
      (result: string | boolean) => {
        if (result === true) {
          window.Welcome.login()
        } else {
          setError(result.toString())
        }
      }
    )

    window.Welcome.on(WelcomeChannelsEnum.login, () => setLoading(false))
  }

  return (
    <MainLayout>
      <Grid container mb={1.5}>
        {error && (
          <Grid item xs={12} mb={-1} mt={-1}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}
        <Grid item xs={10} mt={3}>
          <Typography variant="h4" mb={3}>
            Import Existing Key
          </Typography>
          <Typography>Please enter your secret phrase</Typography>
        </Grid>
        <Grid item xs={2} mt={3}>
          <Button
            variant="outlined"
            onClick={window.Welcome.pasteMnemonic}
            sx={{ ml: 5 }}
          >
            Paste
          </Button>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        {secretPhrase.map((word, index) => (
          <Grid item xs={3} key={index}>
            <TextField
              name={index.toString()}
              label={index + 1}
              value={word}
              onChange={handleChange}
              disabled={index ? !secretPhrase[index - 1] : false}
            />
          </Grid>
        ))}
      </Grid>
      <Box mt={4}>
        <Button
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
  )
}

export default ImportExisting
