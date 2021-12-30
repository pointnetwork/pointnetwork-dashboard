const helpers = require('../helpers');
const path = require('path');
const util = require('util');
const _ = require('lodash');
const execPromBeforeWrapper = util.promisify(require('child_process').exec);
const execProm = async(cmd) => {
    if (_.startsWith(cmd, 'sudo ')) {
        return await new Promise((resolve, reject) => {
            try {
                const sudo = require('sudo-prompt');
                var cb = (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                    } else {
                        console.log(stdout);
                        console.error(stderr);
                    }
                    resolve(true);
                }
                sudo.exec(cmd, {}, cb);
            } catch(e) {
                reject(e);
            }
        });
    } else {
        return await execPromBeforeWrapper(cmd);
    }
};
// const uname = require('node-uname');
const sudo = require('sudo-prompt');
const { http, https } = require('follow-redirects');
const fs = require('fs-extra');
const { platform, arch } = require('process');
const which = require('which');

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
        if (which.sync('docker', {nothrow: true}) != null) {
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
};
