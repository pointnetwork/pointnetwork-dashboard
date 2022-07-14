import { FunctionComponent, useContext } from 'react'
// MUI
import Grid from '@mui/material/Grid'
// Context
import { useMainStatus, MainStatusContext } from '../context/MainStatusContext'
import {
  UpdateStatusContext,
  useUpdateStatus,
} from '../context/UpdateStatusContext'
// Components
import CheckForUpdatesDialog from './components/CheckForUpdatesDialog'
import DashboardUpdateAlert from './components/DashboardUpdateAlert'
import DefaultLoader from './components/DefaultLoader'
import DisplayIdentifier from '../../../shared/react-components/DisplayIdentifier'
import MainContent from './components/MainContent'
import Sidebar from './components/Sidebar'
import TimeoutAlert from './components/TimeoutAlert'
import UIThemeProvider from '../../../shared/react-components/UIThemeProvider'

const App = () => {
  const { identifier, launchFailed, loader } = useContext(MainStatusContext)
  const { updateDialogOpen } = useContext(UpdateStatusContext)

  return (
    <UIThemeProvider>
      <DisplayIdentifier identifier={identifier} />
      <DashboardUpdateAlert />
      <TimeoutAlert identifier={identifier} open={launchFailed} />

      <CheckForUpdatesDialog />

      <DefaultLoader
        isOpen={loader.isLoading && !updateDialogOpen}
        message={loader.message}
      />

      <Grid container height="99.5vh">
        <Sidebar />
        <MainContent />
      </Grid>
    </UIThemeProvider>
  )
}

const AppWithContext: FunctionComponent = () => {
  const mainStatus = useMainStatus()
  const updateStatus = useUpdateStatus()

  return (
    <MainStatusContext.Provider value={mainStatus}>
      <UpdateStatusContext.Provider value={updateStatus}>
        <App />
      </UpdateStatusContext.Provider>
    </MainStatusContext.Provider>
  )
}

export default AppWithContext
