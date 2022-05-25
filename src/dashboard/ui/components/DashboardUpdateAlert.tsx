import { useState, useEffect, ReactEventHandler } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'

const DashboardUpdateAlert = () => {
  const [showAlert, setShowAlert] = useState<boolean>(false)
  const [status, setStatus] = useState<{
    isUpdateAvailable: boolean
    latestVersion: string
  }>({
    isUpdateAvailable: false,
    latestVersion: '',
  })

  useEffect(() => {
    window.Dashboard.on(
      'dashboard:isNewDashboardReleaseAvailable',
      (message: { isUpdateAvailable: boolean; latestVersion: string }) => {
        setStatus(message)
        if (message.isUpdateAvailable) setShowAlert(true)
      }
    )
    window.Dashboard.isNewDashboardReleaseAvailable()
  }, [])

  const openDonwloadLink: ReactEventHandler = () => {
    window.Dashboard.openDashboardDownloadLink(
      `https://pointnetwork.io/download`
    )
  }

  const handleCloseAlert: ReactEventHandler = () => {
    setShowAlert(false)
    // Alerts the user once again after 2 mins if they close the alert without updating
    setTimeout(window.Dashboard.isNewDashboardReleaseAvailable, 120000)
  }

  if (!status.isUpdateAvailable) return null

  return showAlert ? (
    <Alert
      sx={{ position: 'absolute', right: 12, top: 36, zIndex: 999999 }}
      severity="info"
      onClose={handleCloseAlert}
    >
      <AlertTitle>New Update Available</AlertTitle>
      Click{' '}
      <strong style={{ cursor: 'pointer' }} onClick={openDonwloadLink}>
        here
      </strong>{' '}
      to download the latest version
    </Alert>
  ) : null
}

export default DashboardUpdateAlert
