import {createContext, useEffect, useState} from "react";
import {
  DashboardChannelsEnum,
  FirefoxChannelsEnum,
  GenericChannelsEnum,
  NodeChannelsEnum,
  UninstallerChannelsEnum
} from "../../@types/ipc_channels";
import {LaunchProcessLog} from "../../@types/generic";
import {MainStatus} from "../../@types/context";

export const useMainStatus = () => {
  const [identifier, setIdentifier] = useState<string>('')
  const [browserVersion, setBrowserVersion] = useState<string>('')
  const [nodeVersion, setNodeVersion] = useState<string>('')
  const [launchAttempts, setLaunchAttempts] = useState<number>(0)
  const [loader, setIsLaunching] = useState<{
    isLoading: boolean
    message: string
  }>({ isLoading: true, message: 'Checking for updates...' })
  const [isBrowserRunning, setIsBrowserRunning] = useState<boolean>(false)
  const [isNodeRunning, setIsNodeRunning] = useState<boolean>(false)

  // Register these events once to prevent leaks
  const setListeners = () => {
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
          message: 'Starting Point Network'
        })
      } else {
        setIsLaunching({isLoading: false, message: ''})
      }
    })
  }

  const getInfo = async () => {
    const [id, pointNodeVersion, firefoxVersion] = await Promise.all([
      window.Dashboard.getIndentifier(),
      window.Dashboard.getNodeVersion(),
      window.Dashboard.getFirefoxVersion()
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
    if (isNodeRunning) window.Dashboard.launchBrowser()
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
    loader
  }
}

export const MainStatusContext = createContext<MainStatus>({} as unknown as MainStatus)
