import { useState } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { Container, Typography } from '@mui/material'
import SeedGenerator from './seedGenerator'
import SeedConfirmation from './seedConfirmation'

const theme = createTheme({
  typography: {
    fontFamily: 'Arial',
  },
})

export default function App() {
  const [seedConfirm, setSeedConfirm] = useState<boolean>(false)
  const [seed, setSeed] = useState<string>('')
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false)

  const login = () => {
    setSeed('')
    setIsLoggingIn(true)
    setSeedConfirm(true)
  }

  const goBack = () => {
    setIsLoggingIn(false)
    setSeedConfirm(false)
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{ marginTop: '5px' }}>
        <Typography variant="h4" gutterBottom component="div">
          Point Network
        </Typography>
        {!seedConfirm && (
          <SeedGenerator
            seed={seed}
            setSeed={setSeed}
            confirm={() => setSeedConfirm(true)}
            login={login}
          />
        )}

        {seedConfirm && (
          <SeedConfirmation
            isLoggingIn={isLoggingIn}
            seed={seed}
            goBack={goBack}
          />
        )}
      </Container>
    </ThemeProvider>
  )
}
