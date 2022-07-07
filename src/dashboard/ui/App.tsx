import { useEffect, useState } from 'react'
// MUI
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
// Components
import CheckForUpdatesDailog from './components/CheckForUpdatesDailog'
import DashboardTitle from './components/DashboardTitle'
import DefaultLoader from './components/DefaultLoader'
import DisplayIdentifier from '../../../shared/react-components/DisplayIdentifier'
import ResourceItemCard from './components/ResourceItemCard'
import TopBar from './components/TopBar'
import UIThemeProvider from '../../../shared/react-components/UIThemeProvider'
import WalletInfo from './components/WalletInfo'
import DashboardUpdateAlert from './components/DashboardUpdateAlert'
import TimeoutAlert from './components/TimeoutAlert'
// Types
import {
  DashboardChannelsEnum,
  FirefoxChannelsEnum,
  GenericChannelsEnum,
  NodeChannelsEnum,
  UninstallerChannelsEnum,
} from '../../@types/ipc_channels'
import { LaunchProcessLog } from '../../@types/generic'
// Icons
import { ReactComponent as FirefoxLogo } from '../../../assets/firefox-logo.svg'
import { ReactComponent as PointLogo } from '../../../assets/point-logo.svg'

const App = () => {
  const [identifier, setIdentifier] = useState<string>('')
  const [browserVersion, setBrowserVersion] = useState<string>('')
  const [nodeVersion, setNodeVersion] = useState<string>('')
  // Update related state variables
  const [updateDialogOpen, setUpdateDialogOpen] = useState<boolean>(false)
  // Running state variables
  const [launchAttempts, setLaunchAttempts] = useState<number>(0)
  const [loader, setIsLaunching] = useState<{
    isLoading: boolean
    message: string
  }>({ isLoading: true, message: 'Starting Point Network' })
  const [isBrowserRunning, setIsBrowserRunning] = useState<boolean>(false)
  const [isNodeRunning, setIsNodeRunning] = useState<boolean>(false)

  // 1. The very first thing we do is to check for updates
  useEffect(() => {
    window.Dashboard.checkForUpdates()
  }, [])

  // 2. If everything is up to date, we wait for update dailog to close, then we launch the node first and ping it
  useEffect(() => {
    if (!updateDialogOpen) {
      window.Dashboard.launchNodeAndPing()
      setInterval(window.Dashboard.pingNode, 10000)
    }
  }, [updateDialogOpen])

  // 3. Once node is running, we launch the browser
  useEffect(() => {
    if (isNodeRunning) window.Dashboard.launchBrowser()
  }, [isNodeRunning])

  // 4. Once browser is running, we finish the launch procedure
  useEffect(() => {
    if (isBrowserRunning) {
      setIsLaunching({
        isLoading: false,
        message: 'Launched',
      })
    }
  }, [isBrowserRunning])

  // Register these events once to prevent leaks
  useEffect(() => {
    window.Dashboard.getIndentifier()
    window.Dashboard.getFirefoxVersion()
    window.Dashboard.getNodeVersion()

    window.Dashboard.on(NodeChannelsEnum.running_status, (_: string) => {
      const parsed: LaunchProcessLog = JSON.parse(_)
      setIsNodeRunning(parsed.isRunning)

      if (!parsed.isRunning) {
        console.log('Entered !parsed.isRunning')
        setTimeout(window.Dashboard.launchNodeAndPing, 2000)
        setLaunchAttempts(prev => {
          if (prev >= 5)
            setIsLaunching(prev => ({
              ...prev,
              message: `Starting Point Network (please wait)`,
            }))
          return prev + 1
        })
      } else {
        setLaunchAttempts(0)
      }
    })

    window.Dashboard.on(FirefoxChannelsEnum.running_status, (_: string) => {
      const parsed: LaunchProcessLog = JSON.parse(_)
      setIsBrowserRunning(parsed.isRunning)
    })

    window.Dashboard.on(UninstallerChannelsEnum.running_status, (_: string) => {
      const parsed: LaunchProcessLog = JSON.parse(_)
      setIsLaunching({ isLoading: parsed.isRunning, message: parsed.log })
    })

    window.Dashboard.on(DashboardChannelsEnum.closing, () => {
      setIsLaunching({
        isLoading: true,
        message: 'Closing Point',
      })
    })

    window.Dashboard.on(DashboardChannelsEnum.log_out, () => {
      setIsLaunching({
        isLoading: true,
        message: 'Logging Out',
      })
    })

    window.Dashboard.on(
      GenericChannelsEnum.get_identifier,
      (identifier: string) => {
        setIdentifier(identifier)
      }
    )

    window.Dashboard.on(FirefoxChannelsEnum.get_version, (v: string) => {
      setBrowserVersion(v)
    })
    window.Dashboard.on(NodeChannelsEnum.get_version, (v: string) => {
      setNodeVersion(v)
    })
  }, [])

  return (
    <UIThemeProvider>
      <TopBar isBrowserRunning={isBrowserRunning} />
      <DisplayIdentifier identifier={identifier} />
      <DashboardUpdateAlert />
      <TimeoutAlert identifier={identifier} launchAttempts={launchAttempts} />

      <CheckForUpdatesDailog
        dialogOpen={updateDialogOpen}
        setDialogOpen={setUpdateDialogOpen}
      />

      <DefaultLoader
        isOpen={loader.isLoading && !updateDialogOpen}
        message={loader.message}
      />

      <Box p={3} pt={5} sx={{ opacity: loader.isLoading ? 0.2 : 1 }}>
        <DashboardTitle />
        <WalletInfo isNodeRunning={isNodeRunning} />
        <Grid container spacing={2} mt={1}>
          <Grid item xs={6}>
            <ResourceItemCard
              title="Point Browser (Firefox)"
              status={isBrowserRunning}
              onClick={window.Dashboard.launchBrowser}
              icon={<FirefoxLogo />}
              buttonLabel="Launch Browser"
              isLoading={isBrowserRunning}
              version={browserVersion}
            />
          </Grid>
          <Grid item xs={6}>
            <ResourceItemCard
              title="Point Engine"
              status={isNodeRunning}
              onClick={() => {}}
              icon={<PointLogo />}
              buttonLabel="Launch Engine"
              isLoading={isNodeRunning}
              version={nodeVersion}
            />
          </Grid>
        </Grid>
      </Box>
    </UIThemeProvider>
  )
}

export default App
