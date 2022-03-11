import { MouseEventHandler, useEffect, useState, Fragment } from 'react'
// Material UI
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import UIThemeProvider from '../../../shared/UIThemeProvider'
// Icons
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { ReactComponent as FirefoxLogo } from '../../../assets/firefox-logo.svg'
import { ReactComponent as PointLogo } from '../../../assets/point-logo.svg'

export default function App() {
  const [isNodeRunning, setIsNodeRunning] = useState<boolean>(false)
  const [isFirefoxRunning, setIsFirefoxRunning] = useState<boolean>(false)

  const [isLoadingWalletInfo, setIsLoadingWalletInfo] = useState<boolean>(true)
  const [walletInfo, setWalletInfo] = useState<{
    address: string
    balance: string
  }>({
    address: '',
    balance: '',
  })

  useEffect(() => {
    checkNode()
    window.Dashboard.on('firefox:active', (status: boolean) => {
      setIsFirefoxRunning(status)
    })
    window.Dashboard.on('pointNode:checked', (status: boolean) => {
      setIsNodeRunning(status)
      status && !isFirefoxRunning && openFirefox()
    })
    window.Dashboard.on('node:wallet_info', (message: string) => {
      setWalletInfo(JSON.parse(message))
      setIsLoadingWalletInfo(false)
    })
    setTimeout(() => {
      requestYPoints()
      checkNode()
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
  const requestYPoints = () => {
    setIsLoadingWalletInfo(true)
    window.Dashboard.checkBalanceAndAirdrop()
  }

  return (
    <UIThemeProvider>
      <Box sx={{ px: '3.5%', pt: '3.5%' }}>
        <Box
          display={'flex'}
          flexDirection="row-reverse"
          sx={{ mt: '-3%', mb: '-1%' }}
        >
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
        <Grid
          container
          sx={{
            my: '.65rem',
            p: '1rem',
            pt: '.65rem',
          }}
          borderRadius={2}
          border={'2px dashed'}
          borderColor="primary.light"
        >
          <Grid item xs={12} marginBottom={1}>
            {!isLoadingWalletInfo && Number(walletInfo.balance) <= 0 && (
              <Alert severity="info">
                You need yPoints to be able to browse the Web3.0. Click "Request
                yPoints" button to get some yPoints.
              </Alert>
            )}
          </Grid>
          <Grid item xs={11}>
            <Typography variant="h6" component="h2" marginBottom={'2px'}>
              Your Wallet Info
            </Typography>
          </Grid>
          {isLoadingWalletInfo ? (
            <Grid item xs={12} display="flex" marginY={2}>
              <CircularProgress size={20} />
              <Typography sx={{ ml: '.6rem' }}>
                Getting Wallet Info...
              </Typography>
            </Grid>
          ) : (
            <Fragment>
              <Grid item xs={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Wallet Address
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant="subtitle2">
                  {walletInfo.address || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Balance
                </Typography>
              </Grid>
              <Grid item xs={8} marginBottom={2}>
                <Typography variant="subtitle2">
                  {`${walletInfo.balance} yPoints` || 'N/A'}
                </Typography>
              </Grid>
              <Button
                variant="contained"
                disabled={Number(walletInfo.balance) > 0}
                onClick={requestYPoints}
              >
                Request yPoints
              </Button>
            </Fragment>
          )}
        </Grid>

        <Box
          sx={{
            my: '1rem',
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
            isNodeRunning={isNodeRunning}
          />
          <ResourceItemCard
            title="Point Node"
            status={isNodeRunning}
            onClick={checkNode}
            icon={<PointLogo />}
            buttonLabel="Check Status"
            isNodeRunning={isNodeRunning}
          />
        </Box>
        {!isNodeRunning && (
          <Alert severity="info">
            NOTE: It takes around 1-2 minutes for the Point Node to become
            active. We're constantly working to shorted the delay. Thanks for
            being patient
          </Alert>
        )}
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
  isNodeRunning,
}: {
  title: string
  buttonLabel: string
  onClick: any
  icon: any
  status: boolean
  isNodeRunning: boolean
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
          {!isNodeRunning ? (
            <>
              <CircularProgress size={20} />
              <Typography color="text.secondary" sx={{ ml: '.6rem' }}>
                Starting...
              </Typography>
            </>
          ) : (
            <>
              <Typography color="text.secondary" sx={{ mr: 0.5 }}>
                Status: {status ? 'Running' : 'Stopped'}
              </Typography>
              {status ? (
                <CheckCircleIcon color="success" />
              ) : (
                <CancelIcon color="error" />
              )}
            </>
          )}
        </Box>
        <Button
          variant="contained"
          sx={{ mt: '2rem' }}
          onClick={onClick}
          disabled={status || !isNodeRunning}
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
