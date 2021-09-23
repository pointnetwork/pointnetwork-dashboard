const helpers = require('../helpers');
const path = require('path');
const util = require('util');
const execProm = util.promisify(require('child_process').exec);

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

    getFileName(osAndArch, version) {
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            return 'Docker Desktop Installer.exe';
        }
        if (osAndArch == 'mac') {
            return `Docker.dmg`;
        }
        // linux & mac
        return '';
    },

    unpack(osAndArch, releasePath, browserDir, cb) {
        if (osAndArch == 'win32' || osAndArch == 'win64') {

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

        }
    },

    getURL(version, osAndArch, language, filename) {
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            return 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe?utm_source=docker&utm_medium=webreferral&utm_campaign=dd-smartbutton&utm_location=module';
        }
        if (osAndArch == 'mac') {
            return 'https://desktop.docker.com/mac/main/amd64/Docker.dmg?utm_source=docker&amp;utm_medium=webreferral&amp;utm_campaign=dd-smartbutton&amp;utm_location=module';
        }
        if (osAndArch == 'linux') {
            return '';
        }
        throw "unrecognized platform";
    },
};
