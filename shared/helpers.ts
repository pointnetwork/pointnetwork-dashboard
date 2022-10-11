import {ErrorsEnum} from './../src/@types/errors';
import {http, https} from 'follow-redirects';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import {platform, arch} from 'process';
import axios from 'axios';
import rmfr from 'rmfr';
import {app} from 'electron';
import {sign} from 'jsonwebtoken';
import Logger from './logger';

const getOS = () => {
    if (platform === 'win32') return 'win';
    if (platform === 'darwin') return 'macos';
    return platform;
};

const getOSAndArch = () => {
    // Returned values: mac, linux-x86_64, linux-i686, win64, win32, or throws an error
    let osAndArch = '';

    if (platform === 'darwin') {
        osAndArch = 'mac';
    }
    if (platform === 'linux') {
        if (arch === 'x64') {
            osAndArch = 'linux-x86_64';
        }
        if (arch === 'ia32') {
            osAndArch = 'linux-i686';
        }
    }
    if (platform === 'win32') {
        if (arch === 'x64') {
            osAndArch = 'win64';
        }
        if (arch === 'ia32') {
            osAndArch = 'win32';
        }
    }

    return osAndArch;
};

const defaultFirefoxInfo = {
    installedReleaseVersion: 'old',
    isInitialized: false
};

const getPlatform = () => {
    global.platform = {
        darwin: platform === 'darwin',
        linux: platform === 'linux',
        win32: platform === 'win32'
    };
};

const getInstalledVersionInfo: (resource: 'node' | 'firefox' | 'sdk') => Promise<{
  installedReleaseVersion: string
  lastCheck: number
}> = async resource => {
    let file;
    switch (resource) {
        case 'firefox':
            file = 'infoFirefox';
            break;
        case 'node':
            file = 'infoNode';
            break;
        case 'sdk':
            file = 'infoSDK';
    }
    const pointPath = getPointPath();
    try {
        return JSON.parse(
            (await fs.readFile(path.join(pointPath, `${file}.json`))).toString()
        );
    } catch (error) {
        return {installedReleaseVersion: undefined};
    }
};

const getLatestReleaseFromGithub = async (
    repository:
    | 'pointnetwork-uninstaller'
    | 'pointnetwork'
    | 'pointsdk'
    | 'pointnetwork-dashboard',
    logger: Logger
): Promise<string> => {
    try {
        if (isTestEnv()) return getReleaseFromGithub(repository);
        const reqOpts = {
            headers: {
                'user-agent': 'node.js',
                'Accept': 'application/vnd.github+json',
                'Authorization': ''
            }
        };
        if (process.env.GITHUB_PAT) reqOpts.headers['Authorization'] = `Bearer ${process.env.GITHUB_PAT}`;
        const res = await axios.get(
            `${getGithubAPIURL()}/repos/pointnetwork/${repository}/releases/latest`,
            reqOpts
        );
        return res.data.tag_name;
    } catch (error) {
        logger.error({
            errorType: ErrorsEnum.GITHUB_ERROR,
            error
        });
        throw error;
    }
};

const getReleaseFromGithub: (
    repository:
        | 'pointnetwork-uninstaller'
        | 'pointnetwork'
        | 'pointsdk'
        | 'pointnetwork-dashboard'
) => Promise<string> = async repository => {
    let version: string | undefined;
    switch (repository) {
        case 'pointnetwork-uninstaller':
            version = process.env.UNINSTALLER_VERSION;
            break;
        case 'pointnetwork-dashboard':
            version = process.env.DASHBOARD_VERSION;
            break;
        case 'pointsdk':
            version = process.env.SDK_VERSION;
            break;
        case 'pointnetwork':
            version = process.env.ENGINE_VERSION;
            break;
    }
    if (version === undefined) throw new Error(ErrorsEnum.TESTENV_ERROR);
    return version;
};

const getHTTPorHTTPs = () => {
    if (global.platform.win32) {
        return https;
    }
    return http;
};

const getSDKFileName = (version: string) => `point_network-${version.replace('v', '')}-an+fx.xpi`;

const getSDKManifestFileName = () => `manifest.json`;

const fixPath = (pathStr: string) => {
    if (global.platform.win32) {
        return pathStr.split(path.sep).join(path.posix.sep);
    }
    // linux & mac
    return pathStr;
};

const getHomePath = () => os.homedir();

const getBrowserFolderPath = async () => {
    const browserDir = path.join(getHomePath(), '.point', 'src', 'point-browser');
    if (!fs.existsSync(browserDir)) {
        await fs.mkdirp(browserDir);
    }
    return browserDir;
};

const getLiveDirectoryPath = () => path.join(getHomePath(), '.point', 'keystore');

const getLiveDirectoryPathResources = () => path.join(getHomePath(), '.point', 'keystore', 'liveprofile');

const getLiveExtensionsDirectoryPathResources = () => path.join(
    getHomePath(),
    '.point',
    'keystore',
    'liveprofile',
    'extensions'
);

const getKeyFileName = () => path.join(getLiveDirectoryPath(), 'key.json');

const getTokenFileName = () => path.join(getLiveDirectoryPath(), 'token.txt');

const getAuthToken = async () => fs.readFile(getTokenFileName(), 'utf8');

const generateAuthJwt = async () =>
    sign({payload: 'point_token'}, await getAuthToken(), {expiresIn: '10s'});

const getArweaveKeyFileName = () => path.join(getLiveDirectoryPath(), 'arweave.json');

const isLoggedIn = () => fs.existsSync(getKeyFileName());

// Retrieves from `infoFirefox.json` if Firefox has been initialized.
// TODO: not used
const getIsFirefoxInit = async () => {
    const pointPath = getPointPath();
    try {
        const info = JSON.parse(
            (await fs.readFile(path.join(pointPath, 'infoFirefox.json'))).toString()
        );
        return info.isInitialized;
    } catch (error) {
        return defaultFirefoxInfo;
    }
};

const setIsFirefoxInit = async (value: boolean) => {
    const infoFilename = 'infoFirefox.json';
    const pointPath = getPointPath();
    try {
        const info = JSON.parse(
            (await fs.readFile(path.join(pointPath, infoFilename))).toString()
        );
        info.isInitialized = value;
        await fs.writeFile(
            path.join(pointPath, infoFilename),
            JSON.stringify(info),
            'utf8'
        );
    } catch (error) {
        console.log(error);
    }
};

const logout = async () => {
    const pointPath = getPointPath();
    // Removing key files.
    if (fs.existsSync(path.join(pointPath, 'contracts'))) {
        await rmfr(path.join(pointPath, 'contracts'));
    }
    await Promise.all([
        (async () => {
            try {
                await fs.unlink(getKeyFileName());
            } catch (e) {
                console.error('Failed to remove key file', e);
            }
        })(),
        (async () => {
            try {
                await fs.unlink(getArweaveKeyFileName());
            } catch (e) {
                console.error('Failed to remove arweave key file', e);
            }
        })()
    ]);
};

const getPointPath = () => path.join(getHomePath(), '.point');

const getPointLockfilePath = () => path.join(getPointPath(), 'point_dashboard');

const getPointPathTemp = () => path.join(app.getPath('temp'), 'point');

const getPointSrcPath = () => path.join(getPointPath(), 'src');

const getPointSoftwarePath = () => path.join(getPointPath(), 'software');

const getBinPath = async () => {
    const dir = path.join(getHomePath(), '.point', 'bin');
    if (!fs.existsSync(dir)) {
        await fs.mkdirp(dir);
    }
    return dir;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop(): void {}

const countFilesinDir = async (dir: string): Promise<number> => {
    let fileCount = 0;
    const entries = await fs.readdir(dir);

    for (const entry of entries) {
        const fullpath = path.resolve(dir, entry);
        const stats = await fs.stat(fullpath);
        if (stats.isDirectory()) {
            fileCount += await countFilesinDir(fullpath);
        } else {
            fileCount++;
        }
    }

    return fileCount;
};

const getInstalledDashboardVersion = () => {
    const pjson = require('../package.json');
    return pjson.version;
};

const isNewDashboardReleaseAvailable = async () => {
    try {
        const githubAPIURL = getGithubAPIURL();
        const url = `${githubAPIURL}/repos/pointnetwork/pointnetwork-dashboard/releases/latest`;
        const reqOpts = {
            headers: {
                'user-agent': 'node.js',
                'Accept': 'application/vnd.github+json',
                'Authorization': ''
            }
        };
        if (process.env.GITHUB_PAT) reqOpts.headers['Authorization'] = `Bearer ${process.env.GITHUB_PAT}`;
        const res = await axios.get(url, reqOpts);
        const latestVersion = res.data.tag_name;

        if (latestVersion.slice(1) > getInstalledDashboardVersion()) {
            return {
                isUpdateAvailable: true,
                latestVersion
            };
        }

        return {
            isUpdateAvailable: false,
            latestVersion
        };
    } catch (error) {
        console.error(error);
    }
};

const isChineseTimezone = () => {
    const offset = new Date().getTimezoneOffset();
    return offset / 60 === -8;
};

const getFaucetURL = () => isChineseTimezone()
    ? 'https://faucet.point.space'
    : 'https://point-faucet.herokuapp.com';

const getGithubURL = () => isChineseTimezone()
    ? 'https://gh-connector.point.space:3888'
    : 'https://github.com';

const getGithubAPIURL = () => isChineseTimezone()
    ? 'https://gh-connector.point.space:3889'
    : 'https://api.github.com';

const delay = (ms: number) =>
    new Promise(resolve => {
        setTimeout(resolve, ms);
    });

const lookupStrInFile = (filename: string, str: string): boolean => {
    try {
        const contents = fs.readFileSync(filename, 'utf-8');
        const result = contents.includes(str);
        return result;
    } catch (err) {
        return false;
    }
};

const isTestEnv = (): boolean => {
    try {
        if (process.env.IS_TEST !== undefined) return true;
        return false;
    } catch (err) {
        return false;
    }
};

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
    getTokenFileName,
    getAuthToken,
    generateAuthJwt,
    getArweaveKeyFileName,
    isLoggedIn,
    logout,
    getPointSrcPath,
    getPointSoftwarePath,
    getBinPath,
    getPointPath,
    getPointLockfilePath,
    getLiveDirectoryPathResources,
    countFilesinDir,
    getInstalledDashboardVersion,
    isNewDashboardReleaseAvailable,
    getSDKFileName,
    getSDKManifestFileName,
    getLiveExtensionsDirectoryPathResources,
    getPointPathTemp,
    getIsFirefoxInit,
    setIsFirefoxInit,
    isChineseTimezone,
    getFaucetURL,
    getGithubURL,
    getGithubAPIURL,
    getLatestReleaseFromGithub,
    getInstalledVersionInfo,
    delay,
    lookupStrInFile,
    getOS,
    isTestEnv
});
