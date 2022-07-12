import { createContext, useEffect, useState } from 'react'
import {
  DashboardChannelsEnum,
  FirefoxChannelsEnum,
  NodeChannelsEnum,
  UninstallerChannelsEnum,
} from '../../@types/ipc_channels'
import { IdentityLog, LaunchProcessLog } from '../../@types/generic'
import { MainStatus } from '../../@types/context'

export const useMainStatus = () => {
  // General
  const [identifier, setIdentifier] = useState<string>('')
  const [loader, setIsLaunching] = useState<{
    isLoading: boolean
    message: string
  }>({ isLoading: true, message: 'Starting Point Network' })
  const [launchAttempts, setLaunchAttempts] = useState<number>(0)
  // Node
  const [nodeVersion, setNodeVersion] = useState<string>('')
  const [isNodeRunning, setIsNodeRunning] = useState<boolean>(false)
  // Browser
  const [browserVersion, setBrowserVersion] = useState<string>('')
  const [isBrowserRunning, setIsBrowserRunning] = useState<boolean>(false)
  // Identity
  const [identityInfo, setIdentityInfo] = useState<IdentityLog>({
    identity: '',
    isFetching: true,
    address: '',
    log: '',
  })
  const [balance, setBalance] = useState<number | string>(0)

  // Register these events once to prevent leaks
  const setListeners = () => {
    window.Dashboard.on(NodeChannelsEnum.running_status, (_: string) => {
      const parsed: LaunchProcessLog = JSON.parse(_)
      setIsNodeRunning(parsed.isRunning)

      if (!parsed.isRunning) {
        setTimeout(window.Dashboard.launchNodeAndPing, 2000)
        setLaunchAttempts(prev => {
          if (prev >= 5) {
            setIsLaunching(prev => ({
              ...prev,
              message: `Starting Point Network (please wait)`,
            }))
          }
          return prev + 1
        })
      } else {
        setLaunchAttempts(0)
      }
    })

    window.Dashboard.on(FirefoxChannelsEnum.running_status, (_: string) => {
      const parsed: LaunchProcessLog = JSON.parse(_)
      setIsBrowserRunning(parsed.isRunning)
    })

    window.Dashboard.on(UninstallerChannelsEnum.running_status, (_: string) => {
      const parsed: LaunchProcessLog = JSON.parse(_)
      setIsLaunching({ isLoading: parsed.isRunning, message: parsed.log })
    })

    window.Dashboard.on(DashboardChannelsEnum.closing, () => {
      setIsLaunching({
        isLoading: true,
        message: 'Closing Point',
      })
    })

    window.Dashboard.on(DashboardChannelsEnum.log_out, () => {
      setIsLaunching({
        isLoading: true,
        message: 'Logging Out',
      })
    })

    window.Dashboard.on(NodeChannelsEnum.get_identity, (_: string) => {
      const parsed: IdentityLog = JSON.parse(_)
      setIdentityInfo(parsed)
    })

    window.Dashboard.on(
      DashboardChannelsEnum.check_balance_and_airdrop,
      (_: string) => {
        setBalance(_)
      }
    )
  }

  const getInfo = async () => {
    const [id, pointNodeVersion, firefoxVersion] = await Promise.all([
      window.Dashboard.getIndentifier(),
      window.Dashboard.getNodeVersion(),
      window.Dashboard.getFirefoxVersion(),
    ])
    setIdentifier(id)
    setNodeVersion(pointNodeVersion)
    setBrowserVersion(firefoxVersion)
  }

  // 1. Set listeners, get info and start node
  const init = async () => {
    setListeners()
    getInfo()
    await window.Dashboard.checkForUpdates()
    window.Dashboard.launchNodeAndPing()
  }
  useEffect(() => {
    init()
  }, [])

  // 2. Once node is running, we launch the browser
  useEffect(() => {
    if (isNodeRunning) {
      window.Dashboard.launchBrowser()
      window.Dashboard.getIdentityInfo()
      window.Dashboard.sendGeneratedEventToBounty()
      window.Dashboard.checkBalanceAndAirdrop()
    }
  }, [isNodeRunning])

  // 3. Once browser is running, we finish the launch procedure
  useEffect(() => {
    if (isBrowserRunning) {
      setIsLaunching({
        isLoading: false,
        message: 'Launched',
      })
    }
  }, [isBrowserRunning])

  return {
    isBrowserRunning,
    isNodeRunning,
    identifier,
    browserVersion,
    nodeVersion,
    launchAttempts,
    loader,
    identityInfo,
    balance,
  }
}

export const MainStatusContext = createContext<MainStatus>(
  {} as unknown as MainStatus
)
