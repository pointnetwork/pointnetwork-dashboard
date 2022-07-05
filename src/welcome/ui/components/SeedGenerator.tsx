import { MouseEventHandler, useEffect, useState } from 'react'
// Material UI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
// Components
import NoShareWarning from './NoShareWarning'

export default function SeedGenerator(props: {
  seed: string
  setSeed: Function
  confirm: MouseEventHandler
  login: MouseEventHandler
}) {

  const [isCopied, setIsCopied] = useState<boolean>(false)

  useEffect(() => {
    window.Welcome.on('welcome:mnemonic_generated', (seed: string) => {
      props.setSeed(seed)
    })

    window.Welcome.on('welcome:mnemonic_copied', () => {      
      setIsCopied(true)
    })

  }, [])

  const generate = () => {
    window.Welcome.generateMnemonic()
  }

  const copyToClipboard = () => {
    window.Welcome.copyMnemonic(props.seed)
  }

  return (
    <>
      <Typography
        color="text.secondary"
        variant="h6"
        sx={{ mt: '.2rem', mb: '1.5rem' }}
      >
        You're so close to enjoying the next generation of the internet! Just a
        few steps left:
      </Typography>

      <Typography gutterBottom>
        Click below to generate a new secret phrase to enter the network.
      </Typography>
      <Card
        variant="outlined"
        sx={{ border: '2px dashed #BBC8D4', mb: '.8rem' }}
      >
        <CardContent>
          <Typography sx={{ fontSize: 20 }} color="green">
            {props.seed}
          </Typography>
        </CardContent>
      </Card>
      {props.seed && <NoShareWarning />}
      <Button
        variant={props.seed ? 'outlined' : 'contained'}
        onClick={generate}
      >
        Generate
      </Button>

      {props.seed && (
        <Button
        sx={{ mx: '.8rem' }}
        variant={isCopied ? 'contained' : 'outlined'}
        onClick={copyToClipboard}
        >
          {isCopied ? 'Copied': 'Copy'}
        </Button>
      )}
      
      {props.seed && (
        <Button
          sx={{ mx: '.8rem' }}
          variant="contained"
          onClick={props.confirm}
        >
          I have it written down, continue &rarr;
        </Button>
      )}

      <Divider sx={{ my: '1.6rem' }} />

      <Box>
        <Typography gutterBottom>
          Already have a secret phrase? Click below to enter your secret
          phrase and log back in.
        </Typography>
        <Button variant="outlined" onClick={props.login}>
          Log In
        </Button>
      </Box>
    </>
  )
}
