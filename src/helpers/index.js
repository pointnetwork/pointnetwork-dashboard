const { http, https } = require('follow-redirects');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const { platform, arch } = require('process');
const execProm = util.promisify(exec);

module.exports = {
    getOSAndArch: () => {
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
    },
    
    getHTTPorHTTPs: (osAndArch) => {
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            return https;
        }
        return http;
    },
    
    fixPath: (osAndArch, pathStr) => {
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            return pathStr.split(path.sep).join(path.posix.sep);
        }
        // linux & mac
        return pathStr;
    },
    
    getPNPath: async (osAndArch) => {
        // const definitelyPosix = projectDir.split(path.sep).join(path.posix.sep);
        const homePath = await module.exports.getHomePath(osAndArch);
        return path.join(homePath, '.point', 'src', 'pointnetwork');
    },
    
    getHomePath: async (osAndArch) => {
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            // NOTE: `wsl echo $HOME` doesn't work.
            const cmd = `wsl realpath ~`;
            try {
                const result = await await execProm(cmd);
                return result.stdout.trim();
            } catch(ex) {
                throw ex;
            }
        }

        return os.homedir();
    },
    
    isDirEmpty: (path) => {
        return fs.readdirSync(path).length === 0;
    },
    
    getPointSrcPath: async (osAndArch) => {
         const homePath = await module.exports.getHomePath(osAndArch);
        return path.join(homePath, 'pointnetwork', 'pointnetwork');
        const pointPath = path.join(homePath, '.point/');
        const pointSrcPath = path.join(pointPath, 'src/');

        if (!fs.existsSync(pointPath)) {
            fs.mkdirSync(pointPath);
        }
        if (!fs.existsSync(pointSrcPath)) {
            fs.mkdirSync(pointSrcPath);
        }

        return pointSrcPath;
     },

    isPNCloned: async (osAndArch) => {
        const git = simpleGit(module.exports.getPointSrcPath(osAndArch));
        const pnPath = await module.exports.getPNPath(osAndArch);
        return fs.existsSync(pnPath);
    },

    clonePN: async (pnPath, osAndArch) => {
        const git = simpleGit(module.exports.getPointSrcPath(osAndArch));
        const pnURL = 'https://github.com/pointnetwork/pointnetwork';

        await git.clone(pnURL, pnPath, (err) => {if (err) throw err;});
        await git.cwd({ path: pnPath, root: true });
    },
};
