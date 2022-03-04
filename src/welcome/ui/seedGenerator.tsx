import { MouseEventHandler, useEffect } from 'react'
import { Button, Card, CardContent, Typography } from '@mui/material'
import CardAlert from './cardAlert'

export default function SeedGenerator(props: {
  seed: string
  setSeed: Function
  confirm: MouseEventHandler
  login: MouseEventHandler
}) {
  useEffect(() => {
    window.Welcome.on('welcome:generated', (seed: string) => {
      props.setSeed(seed)
    })
  }, [])

  const generate = () => {
    window.Welcome.generate()
  }

  return (
    <>
      <Typography variant="subtitle1" color="text.secondary" component="div">
        You're so close to enjoying the next generation of the internet! Just a
        few steps left:
      </Typography>
      <Typography variant="subtitle1" gutterBottom component="div">
        Click below to generate a new seed phrase to enter the network.
      </Typography>
      <Button variant="outlined" onClick={generate}>
        Generate
      </Button>

      <Card
        variant="outlined"
        sx={{ minWidth: 550, border: '2px dashed #BBC8D4' }}
      >
        <CardContent>
          <Typography sx={{ fontSize: 24 }} color="green" gutterBottom>
            {props.seed}
          </Typography>
        </CardContent>
      </Card>
      {props.seed && (
        <>
          <Button variant="outlined" onClick={props.confirm}>
            I have it written down, continue &rarr;
          </Button>
          <CardAlert />
        </>
      )}
      <Typography variant="subtitle1" gutterBottom component="div">
        Already have a secret phrase? Cool, click below to enter your seed
        phrase and log back in.
      </Typography>
      <Button variant="outlined" onClick={props.login}>
        Login
      </Button>
    </>
  )
}
