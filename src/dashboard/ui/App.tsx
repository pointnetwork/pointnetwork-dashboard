import { MouseEventHandler, useEffect, useState } from 'react'
// Material UI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import UIThemeProvider from '../../../shared/UIThemeProvider'
// Icons
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { ReactComponent as FirefoxLogo } from '../../../assets/firefox-logo.svg'
import { ReactComponent as PointLogo } from '../../../assets/point-logo.svg'

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isNodeRunning, setIsNodeRunning] = useState<boolean>(false)
  const [isFirefoxRunning, setIsFirefoxRunning] = useState<boolean>(false)

  useEffect(() => {
    checkNode()
    setIsLoading(true)
    window.Dashboard.on('firefox:active', (status: boolean) => {
      setIsFirefoxRunning(status)
    })
    window.Dashboard.on('pointNode:checked', (status: boolean) => {
      setIsNodeRunning(status)
    })
    setTimeout(() => {
      openFirefox()
      window.Dashboard.checkBalanceAndAirdrop()
      checkNode()
      setIsLoading(false)
    }, 5000)
  }, [])

  const logout: MouseEventHandler = () => {
    window.Dashboard.logOut()
  }
  const checkNode = () => {
    window.Dashboard.checkNode()
  }
  const openFirefox = () => {
    window.Dashboard.openFirefox()
  }

  return (
    <UIThemeProvider>
      <Box sx={{ p: '3.5%' }}>
        <Box display={'flex'} flexDirection="row-reverse" sx={{ mb: '0.5rem' }}>
          <Button variant="contained" onClick={logout}>
            Logout
          </Button>
        </Box>
        <Typography variant="h4" component="h1">
          Welcome to Point Dashboard
        </Typography>
        <Typography color="text.secondary">
          Manage the various point components from here
        </Typography>
        {isLoading && (
          <Box display="flex" sx={{ mt: '2rem' }}>
            <CircularProgress size={20} />
            <Typography sx={{ ml: '.6rem' }}>
              Starting up Node and Browser...
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            opacity: isLoading ? 0.2 : 1,
            my: '1.5rem',
            display: 'grid',
            gridTemplateColumns: { sm: '1fr 1fr' },
            gap: 2,
          }}
        >
          <ResourceItemCard
            title="Point Browser (Firefox)"
            status={isFirefoxRunning}
            onClick={openFirefox}
            icon={<FirefoxLogo />}
            buttonLabel="Launch Browser"
            isLoading={isLoading}
          />
          <ResourceItemCard
            title="Point Node"
            status={isNodeRunning}
            onClick={checkNode}
            icon={<PointLogo />}
            buttonLabel="Check Status"
            isLoading={isLoading}
          />
        </Box>
      </Box>
    </UIThemeProvider>
  )
}

const ResourceItemCard = ({
  title,
  buttonLabel,
  onClick,
  status,
  icon,
  isLoading,
}: {
  title: string
  buttonLabel: string
  onClick: any
  icon: any
  status: boolean
  isLoading: boolean
}) => {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      borderRadius={2}
      sx={{ p: 2 }}
      bgcolor="primary.light"
    >
      <Box flex={3}>
        <Typography variant="h6">{title}</Typography>
        <Box display="flex" alignItems="center">
          <Typography color="text.secondary" sx={{ mr: 0.5 }}>
            Status: {status ? 'Running' : 'Stopped'}
          </Typography>
          {status ? (
            <CheckCircleIcon color="success" />
          ) : (
            <CancelIcon color="error" />
          )}
        </Box>
        <Button
          variant="contained"
          sx={{ mt: '2rem' }}
          onClick={onClick}
          disabled={isLoading}
        >
          {buttonLabel}
        </Button>
      </Box>
      <Box sx={{ opacity: status ? 1 : 0.2 }} flex={1}>
        {icon}
      </Box>
    </Box>
  )
}
