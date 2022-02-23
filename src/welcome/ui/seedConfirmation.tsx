import { useState } from 'react'
import {
  Button,
  Typography,
  TextareaAutosize,
  Card,
  CardContent,
} from '@mui/material'
import CardAlert from './cardAlert'

export default function SeedConfirmation(props: { seedGenerated: string, back: any }) {
  const [seed, setSeed] = useState<string | null>(null)

  const validate = () => {
    window.Welcome.confirm(seed)
    window.Welcome.on('welcome:confirmed', (seedValid: any) => {
      if (
        seedValid &&
        (props.seedGenerated === seed || props.seedGenerated === 'login')
      ) {
        window.Welcome.login({ phrase: seed, firstTime: true })
      }
    })
  }

  return (
    <>
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
            style={{ fontSize: 24, color:'green', width: 550 }}
            onChange={e => setSeed(e.currentTarget.value)}
          />
        </CardContent>
      </Card>
      <Button variant="outlined" onClick={validate}>
        Confirm
      </Button>
      <Button variant="outlined" onClick={props.back}>
        Go Back
      </Button>
      <CardAlert/>
    </>
  )
}
