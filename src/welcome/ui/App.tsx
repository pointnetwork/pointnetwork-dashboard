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
  const [seedValue, setSeedValue] = useState<string>('')

  const confirm = (value: string) => {
    setSeedConfirm(!seedConfirm)
    if(value) setSeedValue(value)
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{ marginTop: '5px' }}>
        <Typography variant="h4" gutterBottom component="div">
          Point Network
        </Typography>
        {!seedConfirm && <SeedGenerator confirm={confirm} />}

        {seedConfirm && <SeedConfirmation seedGenerated={seedValue} back={confirm} />}
      </Container>
    </ThemeProvider>
  )
}
