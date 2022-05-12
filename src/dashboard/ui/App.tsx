import { MouseEventHandler, useEffect, useState, useRef } from 'react'
// Material UI
import Box from '@mui/material/Box'
import UIThemeProvider from '../../../shared/UIThemeProvider'
// Icons
import { ReactComponent as FirefoxLogo } from '../../../assets/firefox-logo.svg'
import { ReactComponent as PointLogo } from '../../../assets/point-logo.svg'
// Components
import TopBar from '../../../shared/custom-topbar/TopBar'
import ResourceItemCard from './components/ResourceItemCard'
import DashboardUpdateAlert from './components/DashboardUpdateAlert'
import DashboardTitle from './components/DashboardTitle'
import WalletInfo from './components/WalletInfo'
import UpdateProgress from './components/UpdateProgress'
import DefaultLoader from './components/DefaultLoader'

export default function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [loadingMessage, setLoadingMessage] = useState<string>(
    'Checking for updates'
  )
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const checkStartTime = useRef(0)

  useEffect(() => {
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
      if (!identity) {
        window.Dashboard.sendBountyRequest()
      }
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

    window.Dashboard.on('dashboard:close', () => {
      setLoadingMessage('Closing Dashboard')
      setIsLoading(true)
    })
  }, [])

  useEffect(() => {
    if (!isFirefoxUpdating && !isNodeUpdating && !isSdkUpdating) {
      setIsLoading(true)
      setLoadingMessage('Starting up Node and Point Browser')
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
          if (isRunning !== isNodeRunning) setIsNodeRunning(isRunning)
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
    } else {
      setIsLoading(false)
    }
  }, [isFirefoxUpdating, isNodeUpdating, isSdkUpdating])

  useEffect(() => {
    if (isNodeRunning) {
      openFirefox()
      requestYPoints()
      setInterval(checkNode, 10000)
    }
  }, [isNodeRunning])

  useEffect(() => {
    setIsLoading(false)
  }, [isFirefoxRunning])

  const logout: MouseEventHandler = () => {
    window.Dashboard.logOut()
  }
  const open = Boolean(anchorEl)

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const uninstall = () => {
    window.Dashboard.launchUninstaller()
    handleClose()
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

  return (
    <UIThemeProvider>
      <TopBar isLoading={isLoading} />
      <DashboardUpdateAlert />

      <Box px="3.5%" pt="3%">
        <DashboardTitle
          anchorEl={anchorEl}
          handleClick={handleClick}
          open={open}
          handleClose={handleClose}
          uninstall={uninstall}
        />
        <DefaultLoader message={loadingMessage} isLoading={isLoading} />
        <UpdateProgress
          isLoading={isLoading}
          isNodeUpdating={isNodeUpdating}
          isFirefoxUpdating={isFirefoxUpdating}
          isSdkUpdating={isSdkUpdating}
          nodeUpdateProgess={nodeUpdateProgess}
          firefoxUpdateProgess={firefoxUpdateProgess}
        />
        <WalletInfo
          isLoading={isLoading}
          isNodeUpdating={isNodeUpdating}
          isFirefoxUpdating={isFirefoxUpdating}
          isSdkUpdating={isSdkUpdating}
          isLoadingWalletInfo={isLoadingWalletInfo}
          identity={identity}
          logout={logout}
          requestYPoints={requestYPoints}
          walletInfo={walletInfo}
        />
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
