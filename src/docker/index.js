const helpers = require('../helpers');
const path = require('path');
const util = require('util');
const execProm = util.promisify(require('child_process').exec);
// const uname = require('node-uname');
const sudo = require('sudo-prompt');
const { http, https } = require('follow-redirects');
const fs = require('fs-extra');
const { platform, arch } = require('process');
const which = require('which');

// TODO: Change to class and add as method, then change all instances of `module.exports` to `this.`
async function getComposePath() {
    const osAndArch = helpers.getOSAndArch();
    const pnPath = await helpers.getPNPath(osAndArch);
    const composePath = helpers.fixPath(osAndArch, path.join(pnPath, 'docker-compose.yaml'));
    return composePath;
}

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
    
    async download() {
        const language = args.language;
        const dockerDir = path.join('.', 'docker');
        const osAndArch = helpers.getOSAndArch();
        const filename = module.exports.getFileName(osAndArch, version);
        const releasePath = path.join(dockerDir, filename);
        const dockerRelease = fs.createWriteStream(releasePath);
        const dockerURL = module.exports.getURL(version, osAndArch, language, filename);

        if (!fs.existsSync(dockerDir)){
            fs.mkdirSync(dockerDir);
        }

        const http_s = helpers.getHTTPorHTTPs(osAndArch);

        await http_s.get(dockerURL, async (response) => {
            await response.pipe(dockerRelease);
            dockerRelease.on('finish', () => {
                let cb = function() {
                    win.webContents.send("docker-installed");

                    fs.unlink(releasePath, (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(`\nDeleted file: ${releasePath}`);
                        }
                    });

                    module.exports.createConfigFiles(osAndArch);
                };
                module.exports.unpack(osAndArch, releasePath, dockerDir, cb);
            });
        })
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
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            return 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe';
        }
        if (osAndArch == 'mac') {
            return 'https://desktop.docker.com/mac/main/amd64/Docker.dmg';
        }
        if (osAndArch == 'linux-x86_64') {
            
        }
        throw "unrecognized platform";
    },

    getURLCompose(osAndArch) {
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            
        }
        if (osAndArch == 'mac') {
            // return 'https://github.com/docker/compose/releases/download/1.29.2/docker-compose-Darwin-x86_64';
        }
        if (osAndArch == 'linux-x86_64') {
            return 'https://github.com/docker/compose/releases/download/1.29.2/docker-compose-Linux-x86_64';
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
        if (osAndArch == 'linux-x86_64') {
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
        if (osAndArch == 'linux-x86_64') {
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
        if (osAndArch == 'linux-x86_64') {
            sudo.exec('apt-get update');
            sudo.exec('sudo apt-get install apt-transport-https ca-certificates curl gnupg lsb-release');
            sudo.exec('curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg');
            sudo.exec('echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null');
            sudo.exec('apt-get update');
            sudo.exec('apt-get install docker-ce docker-ce-cli containerd.io');
        }
        throw "unrecognized platform";
    },

    async isComposeRunning() {
        const osAndArch = helpers.getOSAndArch();
        const composePath = getComposePath();
        const cmd = `docker inspect --format "{{json .State.Health}}" $(docker-compose -f ${composePath} ps -q)`;
        
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            return `wsl ${cmd}`;
        }

        try {
            await execProm(cmd);
            return true;
        } catch(e) {
            return false;
        }
    },

    async startCompose() {
        const osAndArch = helpers.getOSAndArch();
        const composePath = getComposePath();
        const cmd = `docker-compose -f ${composePath} up -d`;

        if (osAndArch == 'win32' || osAndArch == 'win64') {
            return `wsl ${cmd}`;
        }

        await execProm(cmd);
    },

    async stopCompose() {
        const osAndArch = helpers.getOSAndArch();
        const composePath = getComposePath();
        const cmd = `docker-compose -f ${composePath} down`;

        if (osAndArch == 'win32' || osAndArch == 'win64') {
            return `wsl ${cmd}`;
        }

        await execProm(cmd);
    }
};
