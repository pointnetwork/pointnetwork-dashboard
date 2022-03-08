import { MouseEventHandler, useEffect, useState } from 'react'
// Material UI
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
// Components
import NoShareWarning from './NoShareWarning'

export default function SeedConfirmation(props: {
  seed: string
  goBack: MouseEventHandler
  isLoggingIn: boolean
}) {
  const [userInput, setUserInput] = useState<string>('')
  const [isSeedsMatch, setIsSeedsMatch] = useState<boolean>(false)

  const validate = () => {
    const trimmedSeed = userInput.trim()
    if (!props.isLoggingIn && props.seed.trim() !== trimmedSeed) return

    window.Welcome.validateMnemonic(trimmedSeed)
    window.Welcome.on('welcome:mnemonic_validated', (seedValid: any) => {
      if (seedValid && (props.seed === trimmedSeed || props.isLoggingIn)) {
        window.Welcome.login({ phrase: trimmedSeed })
      }
    })
  }

  useEffect(() => {
    setIsSeedsMatch(userInput.trim() === props.seed)
  }, [userInput])

  return (
    <Box display="flex" flexDirection="column">
      {!props.isLoggingIn ? (
        <Alert
          severity={isSeedsMatch ? 'success' : 'warning'}
          sx={{ mt: '.7rem', mb: '1.2rem' }}
          variant={isSeedsMatch ? 'filled' : 'standard'}
        >
          The seed phrases {!isSeedsMatch ? 'do not' : ''} match
        </Alert>
      ) : null}
      <Typography>
        Please enter the secret phrase you have written down:
      </Typography>

      <TextField
        placeholder="Enter secret phrase here"
        color={isSeedsMatch ? 'success' : 'primary'}
        sx={{ fontSize: 22, color: 'green', mt: '.4rem', mb: '1rem' }}
        onChange={e => setUserInput(e.currentTarget.value)}
      />

      <Box>
        <Button variant="contained" onClick={validate} disabled={!isSeedsMatch}>
          Confirm
        </Button>
        <Button variant="outlined" onClick={props.goBack} sx={{ mx: '.7rem' }}>
          Go Back
        </Button>
      </Box>

      <Divider sx={{ mt: '1.5rem', mb: '.7rem' }} />

      <NoShareWarning />
    </Box>
  )
}
