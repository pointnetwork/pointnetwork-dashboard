import { app } from 'electron';
import { http, https } from 'follow-redirects';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { platform, arch } from 'process';
import simpleGit from 'simple-git';


export class Helpers {


    private flagPath = "installer-finished";

    getOSAndArch() {
        console.log('platform', platform)
        /*
            Returned values: mac, linux-x86_64, linux-i686, win64, win32, or throws an error
         */
        let osAndArch = '';

        if (platform === 'darwin') {
            osAndArch = 'mac';
        }
        if (platform === 'linux') {
            if (arch === 'x64') {
                osAndArch = 'linux-x86_64';
            }
            if (arch === 'x32') {
                osAndArch = 'linux-i686';
            }
        }
        if (platform === 'win32') {
            if (arch === 'x64') {
                osAndArch = 'win64';
            }
            if (arch === 'x32') {
                osAndArch = 'win32';
            }
        }

        return osAndArch;
    }

    getPlatform() {
        global.platform = {
            darwin: platform === 'darwin',
            linux: platform === 'linux',
            win32: platform === 'win32'
        }
    }

    getHTTPorHTTPs() {
        if (global.platform.win32) {
            return https;
        }
        return http;
    }

    fixPath(pathStr: string) {
        if (global.platform.win32) {
            return pathStr.split(path.sep).join(path.posix.sep);
        }
        // linux & mac
        return pathStr;
    }

    async getPNPath(osAndArch: any) {
        // const definitelyPosix = projectDir.split(path.sep).join(path.posix.sep);
        return path.join(os.homedir(), '.point', 'src', 'pointnetwork');
    }

    async getDashboardPath(osAndArch: any) {
        return path.join(os.homedir(), '.point', 'src', 'pointnetwork-dashboard');
    }

    async getSDKPath(osAndArch: any) {
        return path.join(os.homedir(), '.point', 'src', 'pointsdk');
    }

    async getBrowserFolderPath(osAndArch: any) {
        // const definitelyPosix = projectDir.split(path.sep).join(path.posix.sep);
        const browserDir = path.join(os.homedir(), '.point', 'src', 'point-browser');
        if (!fs.existsSync(browserDir)) {
            fs.mkdirpSync(browserDir);
        }
        return browserDir;
    }

    getHomePath() {
        // TODO: Delete if `os.homedir` works for Windows, too (because of WSL).
        // If not, work with the commented code below.

        // if (global.platform.win32) {
        //     // NOTE: `wsl echo $HOME` doesn't work.
        //     const cmd = `wsl realpath ~`;
        //     try {
        //         const result = await exec(cmd);
        //         return result.stdout.trim();
        //     } catch(ex) {
        //         throw ex;
        //     }
        // }

        return os.homedir();
    }

    async getLiveDirectoryPath() {
        const homedir = await this.getHomePath();
        return path.join(homedir, ".point", "keystore");
    }

    async getKeyFileName() {
        return path.join(await this.getLiveDirectoryPath(), "key.json");
    }

    async getArweaveKeyFileName() {
        return path.join(await this.getLiveDirectoryPath(), "arweave.json");
    }

    async isLoggedIn() {
        return fs.existsSync(await this.getKeyFileName());
    }

    async logout() {
        // Removing key files.
        fs.unlinkSync(await this.getKeyFileName());
        fs.unlinkSync(await this.getArweaveKeyFileName());
        // Relaunching the dashboard to ask for key or generate a new one.
        app.relaunch()
        app.exit()
    }

    isDirEmpty(path: fs.PathLike) {
        return fs.readdirSync(path).length === 0;
    }

    isDirsExist(paths: any[]) {
        return paths.every((path: fs.PathLike) => {
            if (!fs.existsSync(path)) {
                return false;
            }
            return null;
        });
    }

    async getPointPath(osAndArch: any) {
        const pointPath = path.join(os.homedir(), '.point/');

        if (!fs.existsSync(pointPath)) {
            fs.mkdirSync(pointPath);
        }

        return pointPath;
    }

    async getPointSrcPath(osAndArch: any) {
        const pointPath = module.exports.getPointPath(osAndArch);
        const pointSrcPath = path.join(pointPath, 'src/');

        if (!fs.existsSync(pointSrcPath)) {
            fs.mkdirSync(pointSrcPath);
        }

        return pointSrcPath;
    }

    async getPointSoftwarePath(osAndArch: any) {
        const pointPath = module.exports.getPointPath(osAndArch);
        const pointSWPath = path.join(pointPath, 'software/');

        if (!fs.existsSync(pointSWPath)) {
            fs.mkdirSync(pointSWPath);
        }

        return pointSWPath;
    }

    async isPNCloned(osAndArch: any) {
        const pnPath = await module.exports.getPNPath(osAndArch);
        return fs.existsSync(pnPath);
    }

    async isDashboardCloned(osAndArch: any) {
        const dashboardPath = await module.exports.getDashboardPath(osAndArch);
        return fs.existsSync(dashboardPath);
    }

    async isSDKCloned(osAndArch: any) {
        const sdkPath = await module.exports.getSDKPath(osAndArch);
        return fs.existsSync(sdkPath);
    }

    async clonePN(pnPath: any, osAndArch: any) {
        const git = simpleGit(module.exports.getPointSrcPath(osAndArch));
        const pnURL = 'https://github.com/pointnetwork/pointnetwork';

        await git.clone(pnURL, pnPath, (err: any) => { if (err) throw err; });
        await git.cwd({ path: pnPath, root: true });
    }

    async isInstallationDone() {
        const pointPath = await module.exports.getPointPath();
        return fs.pathExistsSync(path.join(pointPath, this.flagPath));
    }

    async setInstallationDone() {
        const pointPath = await module.exports.getPointPath();
        fs.writeFileSync(path.join(pointPath, this.flagPath), "");
    }
}
