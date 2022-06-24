import { useEffect, useRef, useState } from 'react'
// MAterial UI
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
// Components
import CreateDirLogs from './components/CreateDirLogs'
import DownloadExtractLogs from './components/DownloadExtractLogs'
import TopBar from './components/TopBar'
import UIThemeProvider from '../../../shared/react-components/UIThemeProvider'
// Types
import {
  NodeChannelsEnum,
  DashboardChannelsEnum,
  GenericChannelsEnum,
  FirefoxChannelsEnum,
  PointSDKChannelsEnum,
  UninstallerChannelsEnum,
  InstallerChannelsEnum,
} from '../../@types/ipc_channels'

export default function App() {
  const loggerRef = useRef<HTMLElement>()
  const [attempts, setAttempts] = useState<number>(0)
  const [installing, setInstalling] = useState<boolean>(false)
  const [version, setVersion] = useState<string>('')
  const [identifier, setIdentifier] = useState<string>('')

  useEffect(() => {
    window.Installer.getDashboardVersion()
    window.Installer.on(DashboardChannelsEnum.get_version, (version: string) =>
      setVersion(version)
    )
    window.Installer.getIdentifier()
    window.Installer.on(
      GenericChannelsEnum.get_identifier,
      (identifier: string) => setIdentifier(identifier)
    )
    window.Installer.on(InstallerChannelsEnum.error, (_attempt: string) => {
      setAttempts(Number(_attempt))
    })
  }, [])

  function sendStartInstallation() {
    setAttempts(0)
    window.Installer.startInstallation()
    setInstalling(true)
  }

  return (
    <UIThemeProvider>
      <Box position="fixed" right={8} bottom={2}>
        <Typography
          variant="caption"
          ml={1}
          sx={{ opacity: 0.7 }}
          fontFamily="monospace"
        >
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
        {attempts ? (
          <Alert severity="error">
            <Typography mb={1} variant="body2">
              {attempts >= 5
                ? `An error occurred during installation. Please quit and try installing again. Make sure you have a stable internet connection and use a VPN (if you can). If you're
        still facing issues, then please contact us. We'll be glad to help
        you out.`
                : `An error occurred during installation. Please try again. Make sure you have a stable internet connection
                and use a VPN (if you can)`}
            </Typography>
            {attempts < 5 ? (
              <Button
                size="small"
                color="error"
                onClick={sendStartInstallation}
                variant="contained"
              >
                Retry Installation
              </Button>
            ) : null}
          </Alert>
        ) : null}
        <Box
          ref={loggerRef}
          sx={{ p: '1rem', mt: '.5rem', overflowY: 'scroll' }}
          bgcolor="primary.light"
          borderRadius={2}
          display={installing ? 'block' : 'none'}
        >
          <CreateDirLogs
            title="Create Directoires"
            channel={InstallerChannelsEnum.create_dirs}
          />
          <CreateDirLogs
            title="Clone Repositories"
            channel={InstallerChannelsEnum.clone_repos}
          />
          <DownloadExtractLogs
            title="Browser"
            downloadChannel={FirefoxChannelsEnum.download}
            unpackChannel={FirefoxChannelsEnum.unpack}
          />
          <DownloadExtractLogs
            title="SDK Extenstion"
            downloadChannel={PointSDKChannelsEnum.download}
          />
          <DownloadExtractLogs
            title="Node"
            downloadChannel={NodeChannelsEnum.download}
            unpackChannel={NodeChannelsEnum.unpack}
          />
          <DownloadExtractLogs
            title="Uninstaller"
            downloadChannel={UninstallerChannelsEnum.download}
            unpackChannel={UninstallerChannelsEnum.unpack}
          />
        </Box>
      </Box>
    </UIThemeProvider>
  )
}
