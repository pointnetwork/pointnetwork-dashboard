import { useEffect, useReducer, useRef, useState } from 'react'
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
import Logs from './components/Logs'
import { parseLog } from '../helpers'
import TopBar from './components/TopBar'

export default function App() {
  const loggerRef = useRef<HTMLElement>()
  const [logs, dispatch] = useReducer(installationLogReducer, initialState)
  const [installing, setInstalling] = useState<boolean>(false)
  const [version, setVersion] = useState<string>('')
  const [identifier, setIdentifier] = useState<string>('')

  useEffect(() => {
    window.Installer.getDashboardVersion()
    window.Installer.on('installer:getDashboardVersion', (version: string) =>
      setVersion(version)
    )
    window.Installer.getIdentifier()
    window.Installer.on('installer:getIdentifier', (identifier: string) =>
      setIdentifier(identifier)
    )
  }, [])

  function sendStartInstallation() {
    window.Installer.startInstallation()
    setInstalling(true)

    window.Installer.on('installer:log', (log: string[]) => {
      const { category, progress, message } = parseLog(log)

      // The UI will only display logs associated to a category.
      if (category) {
        const payload = { message, progress }
        dispatch({ type: category, payload })
        loggerRef.current?.scrollTo({ top: loggerRef.current?.scrollHeight })
      }
    })
  }

  return (
    <UIThemeProvider>
      <Box position="fixed" right={8} bottom={2}>
        <Typography variant="caption" ml={1} sx={{ opacity: 0.7 }}>
          {identifier}
        </Typography>
      </Box>
      <TopBar isLoading={false} />
      <Box
        display={'flex'}
        flexDirection="column"
        sx={{ p: '3.5%', overflow: 'hidden', maxHeight: '82vh' }}
      >
        <Box display="flex" alignItems="baseline">
          <Typography variant="h4" gutterBottom component="h1">
            {installing ? 'Installing' : 'Welcome to the Point Installer'}
          </Typography>
          <Typography ml={1}>v{version}</Typography>
        </Box>

        <Box flex={1} display={installing ? 'none' : 'block'}>
          <Typography>
            The following components will be installed on your system to run
            Point Network
          </Typography>
          <Box
            sx={{ px: '1rem', mt: '1rem', mb: '2rem' }}
            bgcolor="primary.light"
            borderRadius={2}
          >
            <List>
              <ListItemText>Point Node</ListItemText>
              <ListItemText>Point LiveProfile</ListItemText>
              <ListItemText>Point SDK</ListItemText>
              <ListItemText>Point Browser (Firefox)</ListItemText>
              <ListItemText>Point Uninstaller</ListItemText>
            </List>
          </Box>
          <Button variant="contained" onClick={sendStartInstallation}>
            Start Installation
          </Button>
        </Box>
        <Box
          ref={loggerRef}
          sx={{ p: '1rem', mt: '.5rem', overflowY: 'scroll' }}
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
            stepCategory={InstallationStepsEnum.POINT_UNINSTALLER}
            log={logs[InstallationStepsEnum.POINT_UNINSTALLER]}
          />
          <Logs
            stepCategory={InstallationStepsEnum.POINT_SDK}
            log={logs[InstallationStepsEnum.POINT_SDK]}
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
