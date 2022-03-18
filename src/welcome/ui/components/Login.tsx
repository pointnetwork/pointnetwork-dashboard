import { MouseEventHandler, useState } from 'react'
// Material UI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
// Components
import NoShareWarning from './NoShareWarning'

interface Props {
  goBack: MouseEventHandler
}

export default function Login({ goBack }: Props) {
  const [userInput, setUserInput] = useState<string>('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const validate = () => {
    setValidationError(null)
    const trimmedSeed = userInput.trim()
    window.Welcome.validateMnemonic(trimmedSeed)

    window.Welcome.on('welcome:mnemonic_validated', (errorMsg: string) => {
      if (errorMsg) {
        setValidationError(errorMsg)
      } else {
        window.Welcome.login({ phrase: trimmedSeed })
      }
    })
  }

  return (
    <Box display="flex" flexDirection="column">
      <Typography>
        Please enter the secret phrase you have written down:
      </Typography>

      <TextField
        placeholder="Enter secret phrase here"
        sx={{ fontSize: 22, color: 'green', mt: '.4rem', mb: '1rem' }}
        onChange={e => setUserInput(e.currentTarget.value)}
        error={!!validationError}
        helperText={validationError}
      />

      <Box>
        <Button variant="contained" onClick={validate}>
          Confirm
        </Button>
        <Button variant="outlined" onClick={goBack} sx={{ mx: '.7rem' }}>
          Go Back
        </Button>
      </Box>

      <Divider sx={{ mt: '1.5rem', mb: '.7rem' }} />

      <NoShareWarning />
    </Box>
  )
}
