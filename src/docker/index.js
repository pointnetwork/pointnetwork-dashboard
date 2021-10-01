const helpers = require('../helpers');
const path = require('path');
const util = require('util');
const execProm = util.promisify(require('child_process').exec);
const uname = require('node-uname');
const sudo = require('sudo-prompt');
const { http, https } = require('follow-redirects');
import fs from "fs-extra";

module.exports = {
    async getHealthCmd(osAndArch, containerName) {
        const pnPath = await helpers.getPNPath(helpers.getOSAndArch());
        const composePath = helpers.fixPath(osAndArch, path.join(pnPath, 'docker-compose.yaml'));
        const composeDevPath = helpers.fixPath(osAndArch, path.join(pnPath, 'docker-compose.dev.yaml'));

        const cmd = `docker inspect --format "{{json .State.Health}}" $(docker-compose -f ${composePath} -f ${composeDevPath} ps -q ${containerName})`;
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            return `wsl ${cmd}`;
        }
        return cmd;
    },

    async isInstalled() {
        const cmd = 'docker --version';
        const result = await execProm(cmd);

        // TODO: Check what's result output if Docker's not installed. Not sure if it's `undefined`.
        if (result != undefined) {
            return true;
        }
        return false;
    },

    getFileName(osAndArch) {
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            return 'Docker Desktop Installer.exe';
        }
        if (osAndArch == 'mac') {
            return `Docker.dmg`;
        }
        // linux & mac
        return '';
    },

    unpack(osAndArch, releasePath, browserDir) {
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            // Executing installer.
            sudo.exec(releasePath);
        }
        if (osAndArch == 'mac') {
            dmg.mount(releasePath, (err, dmgPath) => {
                fs.copy(`${dmgPath}/Docker.app`, `${browserDir}/Docker.app`, (err) => {
                    if (err) {
                        console.log("Error Found:", err);
                        dmg.unmount(dmgPath, (err) => { if (err) throw err;});
                        return;
                    }
                    dmg.unmount(dmgPath, (err) => { if (err) throw err; cb();});
                });
            });
            return;
        }
        if (osAndArch == 'linux-x86_64' || osAndArch == 'linux-i686') {
            return;
        }
    },

    unpackCompose(osAndArch, releasePath, browserDir) {
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            // Comes with installer.
        }
        if (osAndArch == 'mac') {
            // Comes with installer.
        }
        if (osAndArch == 'linux-x86_64' || osAndArch == 'linux-i686') {
            installDir = module.exports.getInstallDirCompose();
            sudo.exec(`mv `);
        }
    },

    getURL(osAndArch) {
        const u = uname();
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            return 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe';
        }
        if (osAndArch == 'mac') {
            return 'https://desktop.docker.com/mac/main/amd64/Docker.dmg';
        }
        if (osAndArch == 'linux') {
            
        }
        throw "unrecognized platform";
    },

    getURLCompose(osAndArch) {
        const u = uname();
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            
        }
        if (osAndArch == 'mac') {
            
        }
        if (osAndArch == 'linux') {
            return `https://github.com/docker/compose/releases/download/1.29.2/docker-compose-${u.sysname}-${u.machine}`;
        }
        throw "unrecognized platform";
    },

    getInstallDir(osAndArch) {
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            // It's an installer exe.
        }
        if (osAndArch == 'mac') {
            return '/Applications';
        }
        if (osAndArch == 'linux') {
            // We install via 
        }
        throw "unrecognized platform";
    },

    getInstallDirCompose(osAndArch) {
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            // It's an installer exe.
        }
        if (osAndArch == 'mac') {
            // It's an installer.
        }
        if (osAndArch == 'linux') {
            return '/usr/local/bin';
        }
        throw "unrecognized platform";
    },

    async install(osAndArch) {
        if (osAndArch == 'win32' || osAndArch == 'win64' || osAndArch == 'mac') {
            const dockerURL = module.exports.getURL(osAndArch);
            const sw = getPointSoftwarePath(osAndArch);
            const filename = module.exports.getFileName(osAndArch);
            const releasePath = path.join(sw, filename);
            const dockerRelease = fs.createWriteStream(releasePath);

            await http_s.get(dockerURL, async (response) => {
                await response.pipe(dockerRelease);
                dockerRelease.on('finish', () => {
                    docker.unpack(osAndArch, releasePath, sw);
                });
            });
        }

        // TODO: This only works for Debian-based distros.
        if (osAndArch == 'linux') {
            sudo.exec('apt-get update');
            sudo.exec('sudo apt-get install apt-transport-https ca-certificates curl gnupg lsb-release');
            sudo.exec('curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg');
            sudo.exec('echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null');
            sudo.exec('apt-get update');
            sudo.exec('apt-get install docker-ce docker-ce-cli containerd.io');
        }
        throw "unrecognized platform";
    }
};
