import { useState, useEffect } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'

const DashboardUpdateAlert = () => {
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
      }
    )
    window.Dashboard.isNewDashboardReleaseAvailable()
  }, [])

  const openDonwloadLink = () => {
    window.Dashboard.openDashboardDownloadLink(
      `https://pointnetwork.io/download`
    )
  }

  if (!status.isUpdateAvailable) return null

  return (
    <Alert
      sx={{ position: 'absolute', right: '2.5%', top: '2.5%' }}
      severity="info"
    >
      <AlertTitle>New Update Available</AlertTitle>
      Click{' '}
      <strong style={{ cursor: 'pointer' }} onClick={openDonwloadLink}>
        here
      </strong>{' '}
      to download the latest version
    </Alert>
  )
}

export default DashboardUpdateAlert
