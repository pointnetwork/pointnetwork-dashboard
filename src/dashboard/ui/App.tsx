import { MouseEventHandler, useEffect, useState, Fragment, useRef } from 'react'
// Material UI
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import UIThemeProvider from '../../../shared/UIThemeProvider'
// Icons
import { ReactComponent as FirefoxLogo } from '../../../assets/firefox-logo.svg'
import { ReactComponent as PointLogo } from '../../../assets/point-logo.svg'
// Components
import TopBar from './components/TopBar'
import ResourceItemCard from './components/ResourceItemCard'

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [identity, setIdentity] = useState<string | null>(null)
  const [dashboardVersion, setDashboardVersion] = useState<string>('0.0.0')
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [isFirefoxUpdating, setIsFirefoxUpdating] = useState<boolean>(false)
  const [isSdkUpdating, setIsSdkUpdating] = useState<boolean>(false)
  const [isFirefoxRunning, setIsFirefoxRunning] = useState<boolean>(false)
  let isNodeRunning = useRef(false).current
  const [isLoadingWalletInfo, setIsLoadingWalletInfo] = useState<boolean>(true)
  const [walletInfo, setWalletInfo] = useState<{
    address: string
    balance: string
  }>({
    address: '',
    balance: '',
  })
  const [nodeVersion, setNodeVersion] = useState<string | null>(null)
  const [firefoxVersion, setFirefoxVersion] = useState<string | null>(null)
  const [isNewDashboardReleaseAvailable, setIsNewDashboardReleaseAvailable] =
    useState<{
      isUpdateAvailable: boolean
      latestVersion: string
    }>({
      isUpdateAvailable: false,
      latestVersion: '',
    })
  const checkStartTime = useRef(0)

  const balanceStyle = {
    fontWeight: 'bold',
    fontSize: '18px',
  }

  const link = {
    fontWeight: 'bold',
    color: '#401E84',
  }

  const monospace = {
    fontFamily: 'monospace',
    fontSize: '14px',
    fontStyle: 'normal',
    fontVariant: 'normal',
    fontWeight: '700',
    lineHeight: '26.4px',
  }

  useEffect(() => {
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.minHeight = '100vh'
    document.body.style.border = '1.5px solid rgba(0, 0, 0, 0.2)'
    document.body.style.boxSizing = 'border-box'

    window.Dashboard.getDashboardVersion()
    window.Dashboard.on('node:update', (status: boolean) => {
      setIsUpdating(status)
      if (status) {
        window.Dashboard.DownloadNode()
      }
    })

    window.Dashboard.on('sdk:update', (status: boolean) => {
      setIsSdkUpdating(status)
      if (!status) {
        checkNode()
      }
    })

    window.Dashboard.on('firefox:update', (status: boolean) => {
      setIsFirefoxUpdating(status)
      if (status) {
        window.Dashboard.DownloadFirefox()
      }
    })

    window.Dashboard.on('firefox:setVersion', (firefoxVersion: string) => {
      setFirefoxVersion(firefoxVersion)
    })

    window.Dashboard.on('pointNode:finishDownload', () => {
      setIsUpdating(false)
      window.Dashboard.launchNode()
      checkNode()
    })

    window.Dashboard.on('pointSDK:finishDownload', () => {
      setIsSdkUpdating(false)
      checkNode()
    })

    window.Dashboard.on('firefox:finishDownload', () => {
      setIsFirefoxUpdating(false)
      openFirefox()
    })

    window.Dashboard.on('node:identity', (identity: string) => {
      setIdentity(identity)
    })

    window.Dashboard.on('node:getDashboardVersion', (dversion: string) => {
      setDashboardVersion(dversion)
    })

    window.Dashboard.on('firefox:active', (status: boolean) => {
      setIsFirefoxRunning(status)
      window.Dashboard.changeFirefoxStatus(status)
      window.Dashboard.getIdentity()
    })

    window.Dashboard.on(
      'pointNode:checked',
      ({
        version,
        isRunning,
      }: {
        version: string | null
        isRunning: boolean
      }) => {
        setNodeVersion(version)
        if (isRunning) {
          if (isNodeRunning !== isRunning) {
            isNodeRunning = true
            if (!isSdkUpdating) {
              openFirefox()
            }
            requestYPoints()
          }
        } else if (new Date().getTime() - checkStartTime.current < 120000) {
          isNodeRunning = false
          setTimeout(checkNode, 1000)
        } else {
          console.error('Failed to start node in 2 minutes')
          isNodeRunning = false
          setIsLoading(false)
        }
      }
    )

    window.Dashboard.on('node:wallet_info', (message: string) => {
      setWalletInfo(JSON.parse(message))
      setIsLoadingWalletInfo(false)
    })

    window.Dashboard.on(
      'dashboard:isNewDashboardReleaseAvailable',
      (message: { isUpdateAvailable: boolean; latestVersion: string }) => {
        setIsNewDashboardReleaseAvailable(message)
      }
    )

    window.Dashboard.checkUpdate()
    window.Dashboard.isNewDashboardReleaseAvailable()
  }, [])

  useEffect(() => {
    if (
      nodeVersion &&
      isFirefoxRunning &&
      !isLoadingWalletInfo &&
      !isUpdating &&
      !isFirefoxUpdating &&
      !isSdkUpdating
    ) {
      setIsLoading(false)
      setInterval(checkNode, 10000)
    }
  }, [
    isFirefoxUpdating,
    isUpdating,
    nodeVersion,
    isFirefoxRunning,
    isLoadingWalletInfo,
    isSdkUpdating,
  ])

  const logout: MouseEventHandler = () => {
    window.Dashboard.logOut()
  }

  const checkNode = () => {
    if (checkStartTime.current === 0) {
      checkStartTime.current = new Date().getTime()
    }
    window.Dashboard.checkNode()
    window.Dashboard.getIdentity()
  }

  const openFirefox = () => {
    if (!isFirefoxUpdating) {
      window.Dashboard.openFirefox()
    }
  }

  const requestYPoints = () => {
    setIsLoadingWalletInfo(true)
    window.Dashboard.checkBalanceAndAirdrop()
  }

  const openDonwloadLink = () => {
    window.Dashboard.openDashboardDownloadLink(
      `https://github.com/pointnetwork/pointnetwork-dashboard/releases/tag/${isNewDashboardReleaseAvailable.latestVersion}`
    )
  }

  return (
    <UIThemeProvider>
      <TopBar isLoading={isLoading} />

      <Box px="3.5%" pt="3%">
        {isNewDashboardReleaseAvailable.isUpdateAvailable && (
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
        )}
        <Grid container>
          <Grid item xs={4} marginBottom={1}>
            <Typography variant="h4" component="h1">
              Point Dashboard
            </Typography>
          </Grid>
          <Grid item xs={6} marginTop={2.5}>
            <Typography
              variant="caption"
              display="block"
              gutterBottom
              style={{ float: 'none' }}
            >
              v{dashboardVersion}
            </Typography>
          </Grid>
        </Grid>
        <Typography color="text.secondary">
          Manage and control Point Network components from here
        </Typography>

        {isLoading ? (
          isUpdating || isFirefoxUpdating || isSdkUpdating ? (
            <Box display="flex" mt="2rem">
              <CircularProgress size={20} />
              <Typography ml=".6rem">
                {(isUpdating ? 'Point Node ' : 'Firefox') +
                  ' updating... Please wait'}
              </Typography>
            </Box>
          ) : (
            <Box display="flex" mt="1.2rem">
              <CircularProgress size={20} />
              <Typography ml=".6rem">
                Starting up Node and Browser...
              </Typography>
            </Box>
          )
        ) : (
          <Grid
            container
            p="1rem"
            pt=".75rem"
            my=".65rem"
            sx={{
              opacity: isLoading ? 0.2 : 1,
            }}
            borderRadius={2}
            border={'2px dashed'}
            borderColor="primary.light"
          >
            <Grid item xs={12} marginBottom={1}>
              {!isLoadingWalletInfo && Number(walletInfo.balance) <= 0 && (
                <Alert severity="info">
                  You need POINTS to be able to browse the Web3.0. Click
                  "Request POINTS" button to get some POINTS.
                </Alert>
              )}
            </Grid>
            <Grid item xs={11}>
              {identity ? (
                <Typography variant="h6" component="h2" marginBottom={'2px'}>
                  <>
                    You are logged in as{' '}
                    <span style={balanceStyle}>@{identity}</span>
                  </>
                </Typography>
              ) : (
                <Typography variant="h6" component="h2" marginBottom={'2px'}>
                  <>
                    Please create an identity at{' '}
                    <span style={link}>https://point</span>
                  </>
                </Typography>
              )}
            </Grid>
            {isLoadingWalletInfo ? (
              <Grid item xs={12} display="flex" marginY={2}>
                <CircularProgress size={20} />
                <Typography ml=".6rem">Getting Wallet Info...</Typography>
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
                    {walletInfo.address ? (
                      <>
                        <span style={monospace}>{walletInfo.address}</span>
                      </>
                    ) : (
                      'N/A'
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Balance
                  </Typography>
                </Grid>
                <Grid item xs={8} marginBottom={2}>
                  <Typography variant="subtitle2">
                    {walletInfo.balance ? (
                      <>
                        <span style={balanceStyle}>{walletInfo.balance}</span>{' '}
                        yPOINT
                      </>
                    ) : (
                      'N/A'
                    )}
                  </Typography>
                </Grid>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    disabled={Number(walletInfo.balance) > 0}
                    onClick={requestYPoints}
                  >
                    Request yPoints
                  </Button>
                  <Button
                    variant="contained"
                    onClick={logout}
                    style={{ marginRight: '5px' }}
                  >
                    Logout
                  </Button>
                </Stack>
              </Fragment>
            )}
          </Grid>
        )}
        <Box
          display="grid"
          my="1.5rem"
          sx={{
            opacity: isLoading || isUpdating || isFirefoxUpdating ? 0.2 : 1,
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
            isLoading={
              isLoading || isUpdating || isFirefoxUpdating || isFirefoxRunning
            }
            version={firefoxVersion}
          />
          <ResourceItemCard
            title="Point Node"
            status={!!nodeVersion}
            icon={<PointLogo />}
            buttonLabel="Check Status"
            isLoading={isLoading || isUpdating || isFirefoxUpdating}
            version={nodeVersion}
          />
        </Box>
      </Box>
    </UIThemeProvider>
  )
}
