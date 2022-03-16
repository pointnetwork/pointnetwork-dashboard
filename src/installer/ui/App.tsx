import { useRef, useState } from 'react'
// MAterial UI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
// Theme provider
import UIThemeProvider from '../../../shared/UIThemeProvider'

export default function App() {
  const logsElementRef = useRef<HTMLElement>(null)

  const [logs, setLogs] = useState<string[]>([])
  const [installing, setInstalling] = useState<boolean>(false)

  function sendStartInstallation() {
    window.Installer.startInstallation()
    setInstalling(true)

    window.Installer.on('installer:log', (log: string[]) => {
      setLogs(prev => [...prev, `${log.join(' ')}`])
      logsElementRef.current!.scroll(0, logsElementRef.current!.scrollHeight)
    })
  }

  return (
    <UIThemeProvider>
      <Box
        display={'flex'}
        flexDirection="column"
        sx={{ p: '3.5%', overflow: 'hidden', maxHeight: '82vh' }}
      >
        <Typography variant="h4" gutterBottom component="h1">
          {installing ? 'Installing' : 'Welcome to the Point Installer'}
        </Typography>

        <Box flex={1} display={installing ? 'none' : 'block'}>
          <Typography>
            The following components will be installed on your system to run the
            point dashboard
          </Typography>
          <Box
            sx={{ px: '1rem', mt: '1rem', mb: '2rem' }}
            bgcolor="primary.light"
            borderRadius={2}
          >
            <List>
              <ListItemText>Point Node</ListItemText>
              <ListItemText>Point LiveProfile</ListItemText>
              <ListItemText>Point Browser (Firefox)</ListItemText>
            </List>
          </Box>
          <Button variant="contained" onClick={sendStartInstallation}>
            Start Installation
          </Button>
        </Box>
        <Box
          sx={{ p: '1rem', mt: '.5rem', overflowY: 'auto' }}
          bgcolor="primary.light"
          borderRadius={2}
          ref={logsElementRef}
          display={installing ? 'block' : 'none'}
        >
          {logs.map((log, index) => (
            <Typography key={index}>{log}</Typography>
          ))}
        </Box>
      </Box>
    </UIThemeProvider>
  )
}
