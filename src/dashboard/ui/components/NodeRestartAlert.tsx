import { useState, ReactEventHandler, useEffect } from 'react'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'

const NodeRestartAlert = ({
  isNodeRunning,
  isLoading,
}: {
  isNodeRunning: boolean
  isLoading: boolean
}) => {
  if (isLoading) return null

  const [showAlert, setShowAlert] = useState<boolean>(false)

  useEffect(() => {
    setShowAlert(!isNodeRunning)
  }, [isNodeRunning])

  const handleCloseAlert: ReactEventHandler = () => setShowAlert(false)

  return showAlert ? (
    <Alert
      sx={{
        position: 'absolute',
        right: 12,
        top: 36,
        zIndex: 999999,
        maxWidth: '360px',
      }}
      severity="error"
      onClose={handleCloseAlert}
    >
      <Typography fontWeight="bold">Point Node is not running</Typography>
      <Typography>
        Try restarting the Point Node by clicking the 'Restart Node' button
      </Typography>
    </Alert>
  ) : null
}

export default NodeRestartAlert
