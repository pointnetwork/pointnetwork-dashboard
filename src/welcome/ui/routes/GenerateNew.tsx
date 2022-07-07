import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import WelcomeRoutes from './routes'
// Material UI
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Snackbar from '@mui/material/Snackbar'
import Typography from '@mui/material/Typography'
// Components
import MainLayout from '../components/MainLayout'
// Icons
import SendIcon from '@mui/icons-material/Send'
// Types
import { WelcomeChannelsEnum } from '../../../@types/ipc_channels'

const GenerateNew = ({
  route,
  setRoute,
}: {
  route: string
  setRoute: Dispatch<SetStateAction<string>>
}) => {
  if (route !== WelcomeRoutes.new) return null

  const [alert, setAlert] = useState<string>('')
  const [secretPhrase, setSecretPhrase] = useState<string[]>(Array(12).fill(''))

  useEffect(() => {
    window.Welcome.getMnemonic()

    window.Welcome.on(WelcomeChannelsEnum.get_mnemonic, (phrase: string) => {
      phrase && setSecretPhrase(phrase.split(' '))
    })

    window.Welcome.on(
      WelcomeChannelsEnum.generate_mnemonic,
      (phrase: string) => {
        setSecretPhrase(phrase.split(' '))
      }
    )

    window.Welcome.on(WelcomeChannelsEnum.copy_mnemonic, () => {
      setAlert('Copied')
      setTimeout(() => setAlert(''), 3000)
    })
  }, [])

  return (
    <MainLayout navigate={() => setRoute(WelcomeRoutes.home)}>
      <Snackbar
        open={!!alert}
        message={alert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
      <Typography variant="h4" mt={3} mb={2}>
        Generate Secret Phrase
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={7}>
          <Box border="2px dashed #ccc" borderRadius={3} px={2.5} py={1.5}>
            <Grid container>
              {secretPhrase.map((word, idx) => (
                <Grid item xs={6} py={1.5} key={idx}>
                  <Typography>
                    {idx + 1}. {word}
                  </Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Grid>
        <Grid item xs={5}>
          <Alert severity="info">
            <AlertTitle>
              <Typography fontWeight="bold">IMPORTANT</Typography>
            </AlertTitle>
            <Typography mt={-0.7} variant="body2">
              Never share your seedphrase with anyone! Write down and keep it in
              a secure place
            </Typography>
          </Alert>
          <Box mt={1.5} mb={6.5}>
            <Typography mb={1.5}>
              Click "Generate" to generate a new secret phrase
            </Typography>
            <Button
              variant={secretPhrase.some(el => !el) ? 'contained' : 'outlined'}
              sx={{ mr: 1.5 }}
              onClick={window.Welcome.generateMnemonic}
            >
              Generate
            </Button>
            <Button
              variant="outlined"
              onClick={() =>
                window.Welcome.copyMnemonic(secretPhrase.join(' '))
              }
              disabled={secretPhrase.some(el => !el)}
            >
              Copy
            </Button>
          </Box>
          <Button
            variant="contained"
            size="large"
            endIcon={<SendIcon />}
            fullWidth
            onClick={() => setRoute(WelcomeRoutes.verify)}
            disabled={secretPhrase.some(el => !el)}
          >
            Continue
          </Button>
        </Grid>
      </Grid>
    </MainLayout>
  )
}

export default GenerateNew
