import { useState, ReactEventHandler, useEffect } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const DashboardUpdateAlertForLinux = () => {
  const [showAlert, setShowAlert] = useState<boolean>(false)

  useEffect(() => {
    window.Dashboard.on('autoupdater:linux-update', () => {
      setTimeout(() => setShowAlert(true), 1000)
    })
  }, [])

  const handleCloseAlert: ReactEventHandler = () => {
    setShowAlert(false)
    setTimeout(() => setShowAlert(true), 120000)
  }

  return showAlert ? (
    <Alert
      severity="info"
      sx={{
        position: 'fixed',
        top: 48,
        right: 16,
        zIndex: 999999999,
        maxWidth: '360px',
      }}
      onClose={handleCloseAlert}
    >
      <AlertTitle>New Update is available.</AlertTitle>
      <Box display="flex">
        <Typography>
          Click{' '}
          <b
            style={{ cursor: 'pointer' }}
            onClick={() =>
              window.Dashboard.openDashboardDownloadLink(
                'https://github.com/pointnetwork/pointnetwork-dashboard/releases/latest'
              )
            }
          >
            here
          </b>{' '}
          to download the latest version of Point
        </Typography>
      </Box>
    </Alert>
  ) : null
}

export default DashboardUpdateAlertForLinux
