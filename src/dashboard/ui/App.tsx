import {FunctionComponent, useContext} from 'react'
// MUI
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
// Context
import {useMainStatus, MainStatusContext} from '../context/MainStatusContext'
// Components
import CheckForUpdatesDialog from './components/CheckForUpdatesDialog'
import DashboardTitle from './components/DashboardTitle'
import DefaultLoader from './components/DefaultLoader'
import DisplayIdentifier from '../../../shared/react-components/DisplayIdentifier'
import ResourceItemCard from './components/ResourceItemCard'
import TopBar from './components/TopBar'
import UIThemeProvider from '../../../shared/react-components/UIThemeProvider'
import WalletInfo from './components/WalletInfo'
import DashboardUpdateAlert from './components/DashboardUpdateAlert'
import TimeoutAlert from './components/TimeoutAlert'
// Icons
import { ReactComponent as FirefoxLogo } from '../../../assets/firefox-logo.svg'
import { ReactComponent as PointLogo } from '../../../assets/point-logo.svg'
import {UpdateStatusContext, useUpdateStatus} from "../context/UpdateStatusContext";

const App = () => {
  const {
    isBrowserRunning,
    isNodeRunning,
    browserVersion,
    nodeVersion,
    identifier,
    launchAttempts,
    loader
  } = useContext(MainStatusContext)
  const {updateDialogOpen} = useContext(UpdateStatusContext)

  return (
    <UIThemeProvider>
      <TopBar isBrowserRunning={isBrowserRunning} />
      <DisplayIdentifier identifier={identifier} />
      <DashboardUpdateAlert />
      <TimeoutAlert identifier={identifier} launchAttempts={launchAttempts} />

      <CheckForUpdatesDialog />

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
              onClick={window.Dashboard.launchNode}
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

const AppWithContext: FunctionComponent = () => {
  const mainStatus = useMainStatus()
  const updateStatus = useUpdateStatus()

  return <MainStatusContext.Provider value={mainStatus}>
    <UpdateStatusContext.Provider value={updateStatus}>
      <App/>
    </UpdateStatusContext.Provider>
  </MainStatusContext.Provider>
}

export default AppWithContext
