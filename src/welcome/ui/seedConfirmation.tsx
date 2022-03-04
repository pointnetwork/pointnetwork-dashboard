import { MouseEventHandler, useState } from 'react'
import {
  Button,
  Typography,
  TextareaAutosize,
  Card,
  CardContent,
  Alert,
} from '@mui/material'
import CardAlert from './cardAlert'

export default function SeedConfirmation(props: {
  seed: string
  goBack: MouseEventHandler
  isLoggingIn: boolean
}) {
  const [userInput, setUserInput] = useState<string>('')

  const validate = () => {
    const trimmedSeed = userInput.trim()
    if (!props.isLoggingIn && props.seed.trim() !== trimmedSeed) return

    window.Welcome.confirm(trimmedSeed)
    window.Welcome.on('welcome:confirmed', (seedValid: any) => {
      if (seedValid && (props.seed === trimmedSeed || props.isLoggingIn)) {
        window.Welcome.login({ phrase: trimmedSeed })
      }
    })
  }

  return (
    <>
      {!props.isLoggingIn ? (
        <Alert severity={userInput !== props.seed ? 'warning' : 'success'}>
          The seed phrases {userInput !== props.seed ? 'do not' : ''} match
        </Alert>
      ) : null}
      <Typography variant="subtitle1" color="text.secondary" component="div">
        Please enter the secret phrase you have written down:
      </Typography>

      <Card
        variant="outlined"
        sx={{ minWidth: 550, border: '2px dashed #BBC8D4' }}
      >
        <CardContent>
          <TextareaAutosize
            minRows={2}
            placeholder="secret phrase"
            style={{ fontSize: 24, color: 'green', width: 550 }}
            onChange={e => setUserInput(e.currentTarget.value)}
          />
        </CardContent>
      </Card>
      <Button variant="outlined" onClick={validate}>
        Confirm
      </Button>
      <Button variant="outlined" onClick={props.goBack}>
        Go Back
      </Button>
      <CardAlert />
    </>
  )
}
