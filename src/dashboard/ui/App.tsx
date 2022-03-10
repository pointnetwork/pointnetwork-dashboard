import {MouseEventHandler, useEffect, useState, Fragment, useRef} from 'react'
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
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [isFirefoxRunning, setIsFirefoxRunning] = useState<boolean>(false)
  const [isLoadingWalletInfo, setIsLoadingWalletInfo] = useState<boolean>(true)
  const [walletInfo, setWalletInfo] = useState<{
    address: string
    balance: string
  }>({
    address: '',
    balance: '',
  })
  const [nodeVersion, setNodeVersion] = useState<string | null>(null)
  const checkStartTime = useRef(0)

  useEffect(() => {
    window.Dashboard.on('node:update', (status: boolean) => {
      setIsUpdating(status)
      if (status) {
        window.Dashboard.DownloadNode()
      } else {
        checkNode()
      }
    })

    window.Dashboard.on('pointNode:finishDownload', () => {
      setIsUpdating(false)
      window.Dashboard.launchNode()
      checkNode()
    })

    window.Dashboard.on('firefox:active', (status: boolean) => {
      setIsFirefoxRunning(status)
      window.Dashboard.changeFirefoxStatus(status)
    })

    window.Dashboard.on('pointNode:checked', (version: string | null) => {
      setNodeVersion(version)
      if (version) {
        openFirefox()
        requestYPoints()
      } else if (new Date().getTime() - checkStartTime.current < 120000) {
        setTimeout(checkNode, 1000)
      } else {
        console.error('Failed to start node in 2 minutes')
        setIsLoading(false)
      }
    })

    window.Dashboard.on('node:wallet_info', (message: string) => {
      console.log(message)
      setWalletInfo(JSON.parse(message))
      setIsLoadingWalletInfo(false)
    })

    window.Dashboard.checkUpdate()
  }, [])

  useEffect(() => {
    if (nodeVersion && isFirefoxRunning && !isLoadingWalletInfo && !isUpdating) {
      setIsLoading(false)
    }
  }, [isUpdating, nodeVersion, isFirefoxRunning, isLoadingWalletInfo])

  const logout: MouseEventHandler = () => {
    window.Dashboard.logOut()
  }
  const checkNode = () => {
    if (checkStartTime.current === 0) {
      checkStartTime.current = new Date().getTime()
    }
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
        {isLoading ?
          isUpdating ? (
            <Box display="flex" sx={{ mt: '2rem' }}>
              <CircularProgress size={20} />
              <Typography sx={{ ml: '.6rem' }}>
                Point Node is updating... Please wait
              </Typography>
            </Box>
          ) : (
            <Box display="flex" sx={{ mt: '1.2rem' }}>
              <CircularProgress size={20} />
              <Typography sx={{ ml: '.6rem' }}>
                Starting up Node and Browser...
              </Typography>
            </Box>
          ) : (
            <Grid
              container
              sx={{
                my: '.65rem',
                p: '1rem',
                pt: '.75rem',
                opacity: isLoading ? 0.2 : 1,
              }}
              borderRadius={2}
              border={'2px dashed'}
              borderColor="primary.light"
            >
              <Grid item xs={12} marginBottom={1}>
                {!isLoadingWalletInfo && Number(walletInfo.balance) <= 0 && (
                  <Alert severity="info">
                    You need yPoints to be able to browse the Web3.0. Click
                    "Request yPoints" button to get some yPoints.
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
          )}
        <Box
          sx={{
            opacity: isLoading || isUpdating ? 0.2 : 1,
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
            isLoading={isLoading|| isUpdating}
          />
          <ResourceItemCard
            title={"Point Node " + nodeVersion}
            status={!!nodeVersion}
            onClick={checkNode}
            icon={<PointLogo />}
            buttonLabel="Check Status"
            isLoading={isLoading || isUpdating}
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
