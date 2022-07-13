import { createContext, useEffect, useState } from 'react'
import {
  DashboardChannelsEnum,
  FirefoxChannelsEnum,
  GenericChannelsEnum,
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
  }>({ isLoading: true, message: 'Checking for updates...' })
  const [launchAttempts, setLaunchAttempts] = useState<number>(0)
  // Node
  const [nodeVersion, setNodeVersion] = useState<string>('')
  const [isNodeRunning, setIsNodeRunning] = useState<boolean>(false)
  const [engineErrorCode, setEngineErrorCode] = useState<number>(0)
  // Browser
  const [browserVersion, setBrowserVersion] = useState<string>('')
  const [isBrowserRunning, setIsBrowserRunning] = useState<boolean>(false)
  // Identity
  const [identityInfo, setIdentityInfo] = useState<{
    identity: string
    address: string
  }>({
    identity: '',
    address: '',
  })
  const [balance, setBalance] = useState<number | string>(0)

  // Register these events once to prevent leaks
  const setListeners = () => {
    window.Dashboard.on(NodeChannelsEnum.error, (log: string) => {
      const parsed: LaunchProcessLog = JSON.parse(log)
      setIsNodeRunning(parsed.isRunning)
      setEngineErrorCode(+parsed.log)
      setIsLaunching({ isLoading: false, message: '' })
    })

    window.Dashboard.on(NodeChannelsEnum.running_status, (_: string) => {
      const parsed: LaunchProcessLog = JSON.parse(_)
      setIsNodeRunning(parsed.isRunning)
      setLaunchAttempts(parsed.pingErrorCount)
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

    window.Dashboard.on(GenericChannelsEnum.check_for_updates, (_: string) => {
      const parsed = JSON.parse(_)
      if (parsed.success) {
        setIsLaunching({
          isLoading: true,
          message: 'Starting Point Network',
        })
      } else {
        setIsLaunching({ isLoading: false, message: '' })
      }
    })

    window.Dashboard.on(NodeChannelsEnum.get_identity, (_: string) => {
      const parsed: IdentityLog = JSON.parse(_)
      if (!parsed.isFetching)
        setIdentityInfo({ identity: parsed.identity, address: parsed.address })
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

  // 1. Set listeners and get info
  const init = async () => {
    setListeners()
    getInfo()
  }
  useEffect(() => {
    init()
  }, [])

  // 2. Once node is running, we launch the browser
  useEffect(() => {
    if (isNodeRunning) {
      window.Dashboard.launchBrowser()
      window.Dashboard.checkBalanceAndAirdrop()
      window.Dashboard.sendGeneratedEventToBounty()
      setInterval(() => {
        window.Dashboard.getIdentityInfo()
        window.Dashboard.checkBalance()
      }, 10000)
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
    engineErrorCode,
  }
}

export const MainStatusContext = createContext<MainStatus>(
  {} as unknown as MainStatus
)
