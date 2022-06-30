import { useState, useEffect } from 'react'
// MUI
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
// Types
import { DashboardChannelsEnum } from '../../../@types/ipc_channels'
import { UpdateLog } from '../../../@types/generic'

const DashboardUpdateAlert = () => {
  const [showAlert, setShowAlert] = useState<boolean>(false)

  useEffect(() => {
    window.Dashboard.on(
      DashboardChannelsEnum.check_for_updates,
      (_: string) => {
        const parsed = JSON.parse(_) as UpdateLog
        if (parsed.isAvailable) setShowAlert(true)
      }
    )
  }, [])

  return showAlert ? (
    <Alert
      sx={{ position: 'absolute', right: 12, top: 36, zIndex: 999999 }}
      severity="info"
      onClose={() => setShowAlert(false)}
    >
      <AlertTitle>New Update Available</AlertTitle>
      Click{' '}
      <strong
        style={{ cursor: 'pointer' }}
        onClick={window.Dashboard.openDashboardDownloadLink}
      >
        here
      </strong>{' '}
      to download the latest version
    </Alert>
  ) : null
}

export default DashboardUpdateAlert
