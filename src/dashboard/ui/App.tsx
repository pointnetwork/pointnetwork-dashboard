import { MouseEventHandler, useEffect, useState, Fragment, useRef } from 'react'
// Material UI
import Alert from '@mui/material/Alert'
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
import DashboardUpdateAlert from './components/DashboardUpdateAlert'
import DashboardTitle from './components/DashboardTitle'

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  // Update state variables
  const [isNodeUpdating, setIsNodeUpdating] = useState<boolean>(true)
  const [isFirefoxUpdating, setIsFirefoxUpdating] = useState<boolean>(true)
  const [isSdkUpdating, setIsSdkUpdating] = useState<boolean>(true)
  // Progress state variables
  const [nodeUpdateProgess, setNodeUpdateProgress] = useState<number>(0)
  const [firefoxUpdateProgess, setFirefoxUpdateProgress] = useState<number>(0)
  // Running state variables
  const [isFirefoxRunning, setIsFirefoxRunning] = useState<boolean>(false)
  const [isNodeRunning, setIsNodeRunning] = useState<boolean>(false)
  // Wallet info
  const [identity, setIdentity] = useState<string | null>(null)
  const [isLoadingWalletInfo, setIsLoadingWalletInfo] = useState<boolean>(true)
  const [walletInfo, setWalletInfo] = useState<{
    address: string
    balance: string
  }>({
    address: '',
    balance: '',
  })
  // Version state variables
  const [nodeVersion, setNodeVersion] = useState<string | null>(null)
  const [firefoxVersion, setFirefoxVersion] = useState<string | null>(null)

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
    // Add custom styles to window since it's frameless
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.minHeight = '100vh'
    document.body.style.border = '1.5px solid rgba(0, 0, 0, 0.2)'
    document.body.style.boxSizing = 'border-box'

    setIsLoading(true)

    // Check for updates
    window.Dashboard.checkUpdate()

    window.Dashboard.on('node:update', (status: boolean) => {
      setIsNodeUpdating(status)
      if (status) {
        window.Dashboard.DownloadNode()
        window.Dashboard.on('installer:log', ([msg]: string[]) => {
          if (msg.includes('POINT_NODE:')) {
            setNodeUpdateProgress(Number(msg.replace('POINT_NODE:', '')))
          }
        })
      }
    })

    window.Dashboard.on('firefox:update', (status: boolean) => {
      setIsFirefoxUpdating(status)
      if (status) {
        window.Dashboard.DownloadFirefox()
        window.Dashboard.on('installer:log', ([msg]: string[]) => {
          if (msg.includes('BROWSER:')) {
            setFirefoxUpdateProgress(Number(msg.replace('BROWSER:', '')))
          }
        })
      }
    })

    window.Dashboard.on('sdk:update', (status: boolean) => {
      setIsSdkUpdating(status)
    })

    // Check if updates have finished downloading
    window.Dashboard.on('pointNode:finishDownload', () => {
      setIsNodeUpdating(false)
    })

    window.Dashboard.on('pointSDK:finishDownload', () => {
      setIsSdkUpdating(false)
    })

    window.Dashboard.on('firefox:finishDownload', () => {
      setIsFirefoxUpdating(false)
    })

    // Get the versions
    window.Dashboard.getDashboardVersion()

    window.Dashboard.on('firefox:setVersion', (firefoxVersion: string) => {
      setFirefoxVersion(firefoxVersion)
    })

    window.Dashboard.on('node:identity', (identity: string) => {
      setIdentity(identity)
    })

    window.Dashboard.on('firefox:active', (status: boolean) => {
      setIsFirefoxRunning(status)
      window.Dashboard.changeFirefoxStatus(status)
      window.Dashboard.getIdentity()
    })

    window.Dashboard.on('node:wallet_info', (message: string) => {
      setWalletInfo(JSON.parse(message))
      setIsLoadingWalletInfo(false)
    })
  }, [])

  useEffect(() => {
    if (!isFirefoxUpdating && !isNodeUpdating && !isSdkUpdating) {
      // First, launch Node and check if it's running or not
      window.Dashboard.launchNode()
      checkNode()
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
          setIsNodeRunning(isRunning)
          if (
            !isRunning &&
            new Date().getTime() - checkStartTime.current < 120000
          ) {
            setTimeout(checkNode, 1000)
          } else {
            console.error('Failed to start node in 2 minutes')
            setIsLoading(false)
          }
        }
      )
    }
  }, [isFirefoxUpdating, isNodeUpdating, isSdkUpdating])

  useEffect(() => {
    if (isNodeRunning) {
      openFirefox()
      requestYPoints()
      window.Dashboard.getIdentity()
      setIsLoading(false)
      setInterval(checkNode, 10000)
    }
  }, [isNodeRunning])

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
    if (!isFirefoxUpdating) {
      window.Dashboard.openFirefox()
    }
  }

  const requestYPoints = () => {
    setIsLoadingWalletInfo(true)
    window.Dashboard.checkBalanceAndAirdrop()
  }

  return (
    <UIThemeProvider>
      <TopBar isLoading={isLoading} />
      <DashboardUpdateAlert />

      <Box px="3.5%" pt="3%">
        <DashboardTitle />
        {isLoading ? (
          isNodeUpdating || isFirefoxUpdating || isSdkUpdating ? (
            <Box display="flex" mt="2rem">
              <CircularProgress
                size={20}
                thickness={4.2}
                value={
                  isNodeUpdating ? nodeUpdateProgess : firefoxUpdateProgess
                }
                variant="determinate"
              />
              <Typography ml=".6rem">
                {`${isNodeUpdating ? 'Point Node' : 'Firefox'} updating... ${
                  isNodeUpdating ? nodeUpdateProgess : firefoxUpdateProgess
                }%`}
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
                  You are logged in as{' '}
                  <span style={balanceStyle}>@{identity}</span>
                </Typography>
              ) : (
                <Typography variant="h6" component="h2" marginBottom={'2px'}>
                  Please create an identity at{' '}
                  <span style={link}>https://point</span>
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
                      <span style={monospace}>{walletInfo.address}</span>
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
            opacity: isLoading || isNodeUpdating || isFirefoxUpdating ? 0.2 : 1,
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
              isLoading ||
              isNodeUpdating ||
              isFirefoxUpdating ||
              isFirefoxRunning
            }
            version={firefoxVersion}
          />
          <ResourceItemCard
            title="Point Node"
            status={!!nodeVersion}
            icon={<PointLogo />}
            buttonLabel="Check Status"
            isLoading={isLoading || isNodeUpdating || isFirefoxUpdating}
            version={nodeVersion}
          />
        </Box>
      </Box>
    </UIThemeProvider>
  )
}
