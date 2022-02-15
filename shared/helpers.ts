import { app } from 'electron'
import { http, https } from 'follow-redirects'
import path from 'path'
import fs from 'fs-extra'
import os from 'os'
import { platform, arch } from 'process'

const getOSAndArch = () => {
  console.log('platform', platform)
  // Returned values: mac, linux-x86_64, linux-i686, win64, win32, or throws an error
  let osAndArch = ''

  if (platform === 'darwin') {
    osAndArch = 'mac'
  }
  if (platform === 'linux') {
    if (arch === 'x64') {
      osAndArch = 'linux-x86_64'
    }
    if (arch === 'x32') {
      osAndArch = 'linux-i686'
    }
  }
  if (platform === 'win32') {
    if (arch === 'x64') {
      osAndArch = 'win64'
    }
    if (arch === 'x32') {
      osAndArch = 'win32'
    }
  }

  return osAndArch
}

const getPlatform = () => {
  global.platform = {
    darwin: platform === 'darwin',
    linux: platform === 'linux',
    win32: platform === 'win32',
  }
}

const getHTTPorHTTPs = () => {
  if (global.platform.win32) {
    return https
  }
  return http
}

const fixPath = (pathStr: string) => {
  if (global.platform.win32) {
    return pathStr.split(path.sep).join(path.posix.sep)
  }
  // linux & mac
  return pathStr
}

const getHomePath = () => {
  return os.homedir()
}

const getPNPath = async () => {
  return path.join(getHomePath(), '.point', 'src', 'pointnetwork')
}

const getDashboardPath = async () => {
  return path.join(getHomePath(), '.point', 'src', 'pointnetwork-dashboard')
}

const getSDKPath = async () => {
  return path.join(getHomePath(), '.point', 'src', 'pointsdk')
}

const getBrowserFolderPath = async () => {
  const browserDir = path.join(getHomePath(), '.point', 'src', 'point-browser')
  if (!fs.existsSync(browserDir)) {
    fs.mkdirpSync(browserDir)
  }
  return browserDir
}

const getLiveDirectoryPath = async () => {
  return path.join(await getHomePath(), '.point', 'keystore')
}

const getKeyFileName = async () => {
  return path.join(await getLiveDirectoryPath(), 'key.json')
}

const getArweaveKeyFileName = async () => {
  return path.join(await getLiveDirectoryPath(), 'arweave.json')
}

const isLoggedIn = async () => {
  return fs.existsSync(await getKeyFileName())
}

const logout = async () => {
  // Removing key files.
  fs.unlinkSync(await getKeyFileName())
  fs.unlinkSync(await getArweaveKeyFileName())
  // Relaunching the dashboard to ask for key or generate a new one.
  app.relaunch()
  app.exit()
}

const getPointPath = () => {
  const pointPath = path.join(getHomePath(), '.point/')

  if (!fs.existsSync(pointPath)) {
    fs.mkdirSync(pointPath)
  }

  return pointPath
}

const getPointSrcPath = async () => {
  const pointSrcPath = path.join(getPointPath(), 'src/')

  if (!fs.existsSync(pointSrcPath)) {
    fs.mkdirSync(pointSrcPath)
  }

  return pointSrcPath
}

const getPointSoftwarePath = async () => {
  const pointSWPath = path.join(getPointPath(), 'software/')

  if (!fs.existsSync(pointSWPath)) {
    fs.mkdirSync(pointSWPath)
  }

  return pointSWPath
}

const isPNCloned = async () => {
  return fs.existsSync(await getPNPath())
}

const isDashboardCloned = async () => {
  return fs.existsSync(await getDashboardPath())
}

const isSDKCloned = async () => {
  return fs.existsSync(await getSDKPath())
}

export default Object.freeze({
  getOSAndArch,
  getPlatform,
  getHTTPorHTTPs,
  fixPath,
  getPNPath,
  getDashboardPath,
  getSDKPath,
  getBrowserFolderPath,
  getHomePath,
  getLiveDirectoryPath,
  getKeyFileName,
  getArweaveKeyFileName,
  isLoggedIn,
  logout,
  getPointSrcPath,
  getPointSoftwarePath,
  isPNCloned,
  isDashboardCloned,
  isSDKCloned,
})
