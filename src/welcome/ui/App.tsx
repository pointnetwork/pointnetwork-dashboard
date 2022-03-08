import { useState } from 'react'
// Components
import SeedGenerator from './components/SeedGenerator'
import SeedConfirmation from './components/SeedConfirmation'
// MAterial UI
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import UIThemeProvider from '../../../shared/UIThemeProvider'

export default function App() {
  const [seed, setSeed] = useState<string>('')
  const [seedConfirm, setSeedConfirm] = useState<boolean>(false)
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
    <UIThemeProvider>
      <Box sx={{ p: '3.5%' }}>
        <Typography variant="h4" component="h1">
          Welcome to Point Network
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
      </Box>
    </UIThemeProvider>
  )
}
