import { http, https } from 'follow-redirects'
import path from 'path'
import fs from 'fs-extra'
import os from 'os'
import { platform, arch } from 'process'
import welcome from '../src/welcome'
import axios from 'axios'
import type { GithubRelease } from '../src/@types/github-release'
const rimraf = require('rimraf')

const getOSAndArch = () => {
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

const getlatestNodeReleaseVersion = async () => {
  try {
    const url =
      'https://api.github.com/repos/pointnetwork/pointnetwork/releases/latest'
    const headers = { 'user-agent': 'node.js' }
    const res = await axios.get(url, {
      headers: headers,
    })

    console.log('Latest Node version', res.data.tag_name)
    return res.data.tag_name
  } catch (error) {
    console.error(error)
  }
}

const getlatestSdkVersion = async () => {
  try {
    const url =
      'https://api.github.com/repos/pointnetwork/pointsdk/releases/latest'
    const headers = { 'user-agent': 'node.js' }
    const res = await axios.get(url, {
      headers: headers,
    })

    console.log('Latest Sdk version', res.data.tag_name)
    return res.data.tag_name
  } catch (error) {
    console.error(error)
  }
}

const getlatestSDKReleaseVersion = async () => {
  try {
    const url =
      'https://api.github.com/repos/pointnetwork/pointsdk/releases/latest'
    const headers = { 'user-agent': 'node.js' }
    const res = await axios.get(url, {
      headers: headers,
    })

    console.log('Latest SDK version', res.data.tag_name)
    return res.data.tag_name
  } catch (error) {
    console.error(error)
  }
}

const getPortableDashboardDownloadURL = async () => {
  return 'https://github.com/pointnetwork/pointnetwork-dashboard/releases/download/v0.1.0/point-browser.zip'
  const owner = 'pointnetwork'
  const repo = 'phyrox-esr-portable'
  const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`
  const fallback = `https://github.com/${owner}/${repo}/releases/download/91.7.1-58/point-browser-portable-win64-91.7.1-57.zip`
  const re = /point-browser-portable-win64-\d+.\d+.\d+(-\d+)?.zip/

  try {
    const { data } = await axios.get<GithubRelease>(url)
    const browserAsset = data.assets.find(a => re.test(a.name))

    if (!browserAsset) {
      console.log(`No release found in "${url}"`)
      return fallback
    }

    return browserAsset.browser_download_url
  } catch (err) {
    console.log(`Error getting latest release from "${url}"`, err)
    return fallback
  }
}

const getHTTPorHTTPs = () => {
  if (global.platform.win32) {
    return https
  }
  return http
}

const getSDKFileName = (version: string) => {
  return `point_network-${version.replace('v', '')}-an+fx.xpi`
}

const getSDKManifestFileName = (version: string) => {
  return `manifest.json`
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

const getBrowserFolderPath = () => {
  const browserDir = path.join(getHomePath(), '.point', 'src', 'point-browser')
  if (!fs.existsSync(browserDir)) {
    fs.mkdirpSync(browserDir)
  }
  return browserDir
}

const getLiveDirectoryPath = () => {
  return path.join(getHomePath(), '.point', 'keystore')
}

const getLiveDirectoryPathResources = () => {
  return path.join(getHomePath(), '.point', 'keystore', 'liveprofile')
}

const getLiveExtensionsDirectoryPathResources = () => {
  return path.join(getHomePath(), '.point', 'keystore', 'liveprofile', 'extensions')
}

const getKeyFileName = () => {
  return path.join(getLiveDirectoryPath(), 'key.json')
}

const getArweaveKeyFileName = () => {
  return path.join(getLiveDirectoryPath(), 'arweave.json')
}

const isLoggedIn = () => {
  return fs.existsSync(getKeyFileName())
}

const getInstalledNodeVersion = () => {
  const pointPath = getPointPath()
  try {
    const versionData = fs.readFileSync(path.join(pointPath, 'infoNode.json'))
    return JSON.parse(versionData.toString())
  } catch (error) {
    return {
      installedReleaseVersion: 'old',
    }
  }
}

const getInstalledSDKVersion = () => {
  const pointPath = getPointPath()
  try {
    const versionData = fs.readFileSync(path.join(pointPath, 'infoSDK.json'))
    return JSON.parse(versionData.toString())
  } catch (error) {
    return {
      installedReleaseVersion: 'old',
    }
  }
}

const getInstalledFirefoxVersion = () => {
  const pointPath = getPointPath()
  try {
    const versionData = fs.readFileSync(path.join(pointPath, 'infoFirefox.json'))
    const version = versionData.toString()
    const installedVersion = JSON.parse(version)
    return installedVersion
  } catch (error) {
    return {
      installedReleaseVersion: 'old'
    }
  }

}

const logout = () => {
  const pointPath = getPointPath()
  // Removing key files.
  if (fs.existsSync(path.join(pointPath, 'contracts')))
    rimraf.sync(path.join(pointPath, 'contracts'))
  fs.unlinkSync(getKeyFileName())
  fs.unlinkSync(getArweaveKeyFileName())
  // Relaunching the dashboard to ask for key or generate a new one.
  welcome(true)
}

const getPointPath = () => {
  return path.join(getHomePath(), '.point')
}

const getPointSrcPath = () => {
  return path.join(getPointPath(), 'src')
}

const getPointSoftwarePath = () => {
  return path.join(getPointPath(), 'software')
}

const copyFileSync = (source: string, target: string) => {
  let targetFile = target

  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source))
    }
  }

  fs.writeFileSync(targetFile, fs.readFileSync(source))
}

const copyFolderRecursiveSync = (source: string, target: string) => {
  let files = []

  // Check if folder needs to be created or integrated
  const targetFolder = path.join(target, path.basename(source))
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder)
  }

  // Copy
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source)
    files.forEach(function (file) {
      const curSource = path.join(source, file)
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder)
      } else {
        copyFileSync(curSource, targetFolder)
      }
    })
  }
}

const getBinPath = () => {
  const dir = path.join(getHomePath(), '.point', 'bin')
  if (!fs.existsSync(dir)) {
    fs.mkdirpSync(dir)
  }
  return dir
}

function noop(): void { }

const countFilesinDir = async (dir: string): Promise<number> => {
  let fileCount = 0
  const entries = await fs.readdir(dir)

  for (const entry of entries) {
    const fullpath = path.resolve(dir, entry)
    const stats = await fs.stat(fullpath)
    if (stats.isDirectory()) {
      fileCount += await countFilesinDir(fullpath)
    } else {
      fileCount++
    }
  }

  return fileCount
}

const getInstalledDashboardVersion = () => {
  const pjson = require('../package.json')
  return pjson.version
}

const isNewDashboardReleaseAvailable = async () => {
  try {
    const url =
      'https://api.github.com/repos/pointnetwork/pointnetwork-dashboard/releases/latest'
    const headers = { 'user-agent': 'node.js' }
    const res = await axios.get(url, {
      headers: headers,
    })
    const latestVersion = res.data.tag_name

    if (latestVersion.slice(1) > getInstalledDashboardVersion()) {
      return {
        isUpdateAvailable: true,
        latestVersion,
      }
    }

    return {
      isUpdateAvailable: false,
      latestVersion,
    }
  } catch (error) {
    console.error(error)
  }
}

export default Object.freeze({
  noop,
  getOSAndArch,
  getPlatform,
  getHTTPorHTTPs,
  fixPath,
  getBrowserFolderPath,
  getHomePath,
  getLiveDirectoryPath,
  getKeyFileName,
  getArweaveKeyFileName,
  isLoggedIn,
  logout,
  getPointSrcPath,
  getPointSoftwarePath,
  getBinPath,
  copyFileSync,
  copyFolderRecursiveSync,
  getPointPath,
  getInstalledFirefoxVersion,
  getlatestNodeReleaseVersion,
  getInstalledNodeVersion,
  getLiveDirectoryPathResources,
  countFilesinDir,
  getPortableDashboardDownloadURL,
  getInstalledDashboardVersion,
  isNewDashboardReleaseAvailable,
  getlatestSDKReleaseVersion,
  getSDKFileName,
  getSDKManifestFileName,
  getLiveExtensionsDirectoryPathResources,
  getlatestSdkVersion,
  getInstalledSDKVersion,
})
