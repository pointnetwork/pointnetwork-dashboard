import { http, https } from 'follow-redirects'
import path from 'path'
import fs from 'fs-extra'
import os from 'os'
import { platform, arch } from 'process'
import welcome from '../src/welcome'
import axios from 'axios'

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

const getLastNodeVersion = async () => {
  const url = 'https://api.github.com/repos/pointnetwork/pointnetwork/releases/latest'
  const headers = { 'user-agent': 'node.js' }
  const res = await axios.get(url, {
    headers: headers
  });

  console.log('last version', res.data.tag_name)
  global.nodePoint = {
    version: res.data.tag_name?res.data.tag_name: ''
  }
  return true
}

const getLastVersionNode = () => {
  const url = 'https://api.github.com/repos/pointnetwork/pointnetwork/releases/latest'

  return new Promise(resolve => {
    https.get(url, (res: { on: (arg0: string, arg1: any) => void }) => {
      let data = ''

      res.on('data', (chunk: string) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          console.log(json.tag_name);
          global.nodePoint = {
            version: json.tag_name
          }
          resolve(json.tag_name)
        } catch (error: any) {
          console.error(error.message)
        }
      })
    })
  })
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

const getPNPath = () => {
  return path.join(getHomePath(), '.point', 'src', 'pointnetwork')
}

const getDashboardPath = () => {
  return path.join(getHomePath(), '.point', 'src', 'pointnetwork-dashboard')
}

const getSDKPath = () => {
  return path.join(getHomePath(), '.point', 'src', 'pointsdk')
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

const getKeyFileName = () => {
  return path.join(getLiveDirectoryPath(), 'key.json')
}

const getArweaveKeyFileName = () => {
  return path.join(getLiveDirectoryPath(), 'arweave.json')
}

const isLoggedIn = () => {
  return fs.existsSync(getKeyFileName())
}

const getInstalledVersion = () =>{
  const pointPath = getPointPath()
  try {
    const versionData = fs.readFileSync(path.join(pointPath, 'infoNode.json'))
    const version = versionData.toString()
    const installedVersion = JSON.parse(version)
    return installedVersion
  } catch (error) {
    return {
      version: null
    }
  }

}

const logout = () => {
  // Removing key files.
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

const isPNCloned = () => {
  return fs.existsSync(getPNPath())
}

const isDashboardCloned = () => {
  return fs.existsSync(getDashboardPath())
}

const isSDKCloned = () => {
  return fs.existsSync(getSDKPath())
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
  getBinPath,
  copyFileSync,
  copyFolderRecursiveSync,
  getPointPath,
  getLastNodeVersion,
  getInstalledVersion,
  getLastVersionNode,
})
