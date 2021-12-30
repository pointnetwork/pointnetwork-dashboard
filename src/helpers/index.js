const { http, https } = require('follow-redirects');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const util = require('util');
const { platform, arch } = require('process');
const exec = util.promisify(require('child_process').exec);
const simpleGit = require('simple-git');

const INSTALLER_FINISHED_FLAG_PATH = "installer-finished";

class Helpers {
    getOSAndArch() {
        /*
            Returned values: mac, linux-x86_64, linux-i686, win64, win32, or throws an error
         */
        let osAndArch = '';

        if (platform == 'darwin') {
            osAndArch = 'mac';
        }
        if (platform == 'linux') {
            if (arch == 'x64') {
                osAndArch = 'linux-x86_64';
            }
            if (arch == 'x32') {
                osAndArch = 'linux-i686';
            }
        }
        if (platform == 'win32') {
            if (arch == 'x64') {
                osAndArch = 'win64';
            }
            if (arch == 'x32') {
                osAndArch = 'win32';
            }
        }

        if (osAndArch == '') {
            throw 'Platform not supported.';
        }
        return osAndArch;
    }

    getHTTPorHTTPs(osAndArch) {
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            return https;
        }
        return http;
    }

    fixPath(osAndArch, pathStr) {
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            return pathStr.split(path.sep).join(path.posix.sep);
        }
        // linux & mac
        return pathStr;
    }

    async getPNPath(osAndArch) {
        // const definitelyPosix = projectDir.split(path.sep).join(path.posix.sep);
        const homePath = await module.exports.getHomePath(osAndArch);
        return path.join(homePath, '.point', 'src', 'pointnetwork');
    }

    async getBrowserFolderPath(osAndArch) {
        // const definitelyPosix = projectDir.split(path.sep).join(path.posix.sep);
        const homePath = await module.exports.getHomePath(osAndArch);
        const browserDir = path.join(homePath, '.point', 'src', 'point-browser');
        if (!fs.existsSync(browserDir)) {
            fs.mkdirpSync(browserDir);
        }
        return browserDir;
    }

    async getHomePath(osAndArch) {
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
        fs.unlinkSync(await helpers.getKeyFileName());
        fs.unlinkSync(await helpers.getArweaveKeyFileName());
    }

    isDirEmpty(path) {
        return fs.readdirSync(path).length === 0;
    }

    async getPointPath(osAndArch) {
        const homePath = await module.exports.getHomePath(osAndArch);
        const pointPath = path.join(homePath, '.point/');

        if (!fs.existsSync(pointPath)) {
            fs.mkdirSync(pointPath);
        }

        return pointPath;
    }

    async getPointSrcPath(osAndArch) {
        const pointPath = module.exports.getPointPath(osAndArch);
        const pointSrcPath = path.join(pointPath, 'src/');

        if (!fs.existsSync(pointSrcPath)) {
            fs.mkdirSync(pointSrcPath);
        }

        return pointSrcPath;
    }

    async getPointSoftwarePath(osAndArch) {
        const pointPath = module.exports.getPointPath(osAndArch);
        const pointSWPath = path.join(pointPath, 'software/');

        if (!fs.existsSync(pointSWPath)) {
            fs.mkdirSync(pointSWPath);
        }

        return pointSWPath;
    }

    async isPNCloned(osAndArch) {
        const git = simpleGit(module.exports.getPointSrcPath(osAndArch));
        const pnPath = await module.exports.getPNPath(osAndArch);
        return fs.existsSync(pnPath);
    }

    async clonePN(pnPath, osAndArch) {
        const git = simpleGit(module.exports.getPointSrcPath(osAndArch));
        const pnURL = 'https://github.com/pointnetwork/pointnetwork';

        await git.clone(pnURL, pnPath, (err) => {if (err) throw err;});
        await git.cwd({ path: pnPath, root: true });
    }

    async isInstallationDone() {
        const pointPath = await module.exports.getPointPath();
        return fs.pathExistsSync(path.join(pointPath, INSTALLER_FINISHED_FLAG_PATH));
    }

    async setInstallationDone() {
        const pointPath = await module.exports.getPointPath();
        fs.writeFileSync(path.join(pointPath, INSTALLER_FINISHED_FLAG_PATH), "");
    }
}

module.exports = new Helpers;
