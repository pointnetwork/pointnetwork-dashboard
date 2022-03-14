import { useReducer, useState } from 'react'
// MAterial UI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
// Theme provider
import UIThemeProvider from '../../../shared/UIThemeProvider'
import { InstallationStepsEnum } from '../../@types/installation'
import { installationLogReducer, initialState } from '../reducer'
import Logs from './Logs'

export default function App() {
  const [logs, dispatch] = useReducer(installationLogReducer, initialState)
  const [installing, setInstalling] = useState<boolean>(false)

  function sendStartInstallation() {
    window.Installer.startInstallation()
    setInstalling(true)

    window.Installer.on('installer:log', (log: string[]) => {
      if (log.length < 2) return

      const stepCategory = log[0]
      if (stepCategory in InstallationStepsEnum) {
        const msg = log.slice(1).join(' ')
        dispatch({ type: stepCategory as InstallationStepsEnum, payload: msg })
      }
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
          display={installing ? 'block' : 'none'}
        >
          <Logs
            stepCategory={InstallationStepsEnum.DIRECTORIES}
            log={logs[InstallationStepsEnum.DIRECTORIES]}
          />
          <Logs
            stepCategory={InstallationStepsEnum.CODE}
            log={logs[InstallationStepsEnum.CODE]}
          />
          <Logs
            stepCategory={InstallationStepsEnum.BROWSER}
            log={logs[InstallationStepsEnum.BROWSER]}
          />
          <Logs
            stepCategory={InstallationStepsEnum.POINT_NODE}
            log={logs[InstallationStepsEnum.POINT_NODE]}
          />
        </Box>
      </Box>
    </UIThemeProvider>
  )
}
