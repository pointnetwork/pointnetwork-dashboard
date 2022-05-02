import helpers from '../../shared/helpers'
import path from 'path'
import util from 'util'
import _ from 'lodash'
import compose from 'docker-compose'
import sudo from 'sudo-prompt'
import fs from 'fs-extra'
import which from 'which'
import { BrowserWindow } from 'electron'
import { http } from 'follow-redirects'
import Logger from '../../shared/logger'
const dmg = require('dmg')

const logger = new Logger();

export default class {
    private window
    private execPromBeforeWrapper = util.promisify(require('child_process').exec)

    private execProm = async (cmd: string) => {
        if (_.startsWith(cmd, 'sudo ')) {
            return await new Promise((resolve, reject) => {
                try {
                    const sudo = require('sudo-prompt');
                    const cb = (error: any, stdout: any, stderr: any) => {
                      if (error) {
                            logger.error(stderr)
                            reject(error)
                        } else {
                            logger.info(stdout)
                        }
                        resolve(true)
                    }
                    sudo.exec(cmd, {}, cb)
                } catch (e) {
                    reject(e);
                }
            });
        } else {
            return await this.execPromBeforeWrapper(cmd)
        }
    }

    constructor(window: BrowserWindow) {
        this.window = window
    }

    async getComposePath() {
        const pnPath = await helpers.getPNPath()
        const composePath = helpers.fixPath(path.join(pnPath))
        return composePath
    }

    async getComposePathWithFile() {
        const pnPath = await helpers.getPNPath();
        const composePath = helpers.fixPath(path.join(pnPath, 'docker-compose.yaml'));
        return composePath;
    }

    async getHealthCmd(osAndArch: any, containerName: any) {
        const pnPath = await helpers.getPNPath();
        const composePath = helpers.fixPath(path.join(pnPath, 'docker-compose.yaml'));
        const composeDevPath = helpers.fixPath(path.join(pnPath, 'docker-compose.dev.yaml'));

        const cmd = `docker inspect --format '{{json .State.Health}}' $(docker-compose -f ${composePath} -f ${composeDevPath} ps -q ${containerName})`;
        if (global.platform.win32) {
            return `wsl ${cmd}`;
        }
        return cmd;
    }

    async download() {
        const dockerDir = path.join('.', 'docker');
        const osAndArch = helpers.getOSAndArch();
        const filename = this.getFileName();
        const releasePath = path.join(dockerDir, filename);
        const dockerRelease = fs.createWriteStream(releasePath);
        const dockerURL = this.getURL();

        if (!fs.existsSync(dockerDir)) {
            fs.mkdirSync(dockerDir);
        }


        const callback = async (response: any) => {
            await response.pipe(dockerRelease);
            dockerRelease.on('finish', () => {
                const cb = () => {
                    this.window.webContents.send("docker-installed");

                    fs.unlink(releasePath, (err) => {
                        if (err) {
                            logger.info(err);
                        } else {
                            logger.info(`\nDeleted file: ${releasePath}`);
                        }
                    });

                    module.exports.createConfigFiles(osAndArch);
                };
                module.exports.unpack(osAndArch, releasePath, dockerDir, cb);
            });
        }
        await http.get(dockerURL, callback)
    }



    async isInstalled() {
        if (which.sync('docker', { nothrow: true }) != null) {
            return true;
        }
        return false;
    }

    getFileName() {
        if (global.platform.win32) {
            return 'Docker Desktop Installer.exe';
        }
        if (global.platform.darwin) {
            return `Docker.dmg`;
        }
        // linux & mac
        return '';
    }

    unpack(releasePath: any, browserDir: any) {
        if (global.platform.win32) {
            // Executing installer.
            sudo.exec(releasePath);
        }
        if (global.platform.darwin) {
            dmg.mount(releasePath, (_err: any, dmgPath: any) => {
                fs.copy(`${dmgPath}/Docker.app`, `${browserDir}/Docker.app`, (err: any) => {
                    if (err) {
                        logger.info('Error Found:', err);
                        dmg.unmount(dmgPath, (err: any) => { if (err) throw err; });
                        return;
                    }
                    dmg.unmount(dmgPath, (err: any) => { if (err) throw err; });
                });
            });
            return null
        }

    }

    getURL() {
        if (global.platform.win32) {
            return 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe';
        }
        if (global.platform.darwin) {
            return 'https://desktop.docker.com/mac/main/amd64/Docker.dmg';
        }
        return '';
    }

    getURLCompose() {
        if (global.platform.darwin) {
            return 'https://github.com/docker/compose/releases/download/1.29.2/docker-compose-Darwin-x86_64';
        }
        if (global.platform.linux) {
            return 'https://github.com/docker/compose/releases/download/1.29.2/docker-compose-Linux-x86_64';
        }
    }

    getInstallDir() {
        if (global.platform.win32) {
            // It's an installer exe.
        }
        if (global.platform.darwin) {
            return '/Applications';
        }

    }

    getInstallDirCompose() {
        if (global.platform.win32) {
            // It's an installer exe.
        }
        if (global.platform.darwin) {
            // It's an installer.
        }
        if (global.platform.linux) {
            return '/usr/local/bin';
        }
    }

    async install() {
        if (global.platform.win32 || global.platform.darwin) {
            const dockerURL = this.getURL();
            const sw = helpers.getPointSoftwarePath();
            const filename = this.getFileName();
            const releasePath = path.join(filename);
            const dockerRelease = fs.createWriteStream(releasePath);
            const callback = async (response: { pipe: (arg0: any) => any; }) => {
                await response.pipe(dockerRelease);
                dockerRelease.on('finish', () => {
                    this.unpack(releasePath, sw);
                });
            }
            await http.get(dockerURL, callback)
        }

        // TODO: This only works for Debian-based distros.
        if (global.platform.linux) {
            sudo.exec('apt-get update');
            sudo.exec('sudo apt-get install apt-transport-https ca-certificates curl gnupg lsb-release');
            sudo.exec('curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg');
            sudo.exec(`echo 'deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable' | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null`);
            sudo.exec('apt-get update');
            sudo.exec('apt-get install docker-ce docker-ce-cli containerd.io');
        }

    }

    async isComposeRunning() {
        const composePath = await this.getComposePath();
        const cmd = `docker inspect --format '{{json .State.Health}}' $(docker-compose -f ${composePath} ps -q)`;

        if (global.platform.win32) {
            return `wsl ${cmd}`;
        }

        try {
            logger.info(cmd)
            await this.execProm(cmd);
            return true;
        } catch (e) {
            return false;
        }
    }

    async startCompose() {
        const composePath = await this.getComposePath();
        await compose.upAll({
            cwd: composePath,
            callback: (chunk) => {
                logger.info('job in progres: ', chunk.toString('utf8'));
                this.window.webContents.send('docker:log',
                    {
                        log: chunk.toString('utf8'),
                        object: 'statusUI'
                    });
            }
        })
            .then(
                () => {
                    logger.info('job done')
                    this.window.webContents.send('point-node-check');
                },
                (err: { message: any; }) => { logger.info('something went wrong:', err.message) }
            );
    }

    async getLogsNode(child: BrowserWindow) {
        const getLogslogger = new Logger({ window: child, channel: 'docker' })
        const composePath = await this.getComposePath();
        await compose.logs('point_node', {
            follow: true,
            cwd: composePath,
            callback: (chunk) => {
              getLogslogger.info(chunk.toString('utf8'))
            }
        })
            .then(
                err => logger.info('something went wrong:', err)
            );
    }

    async stopCompose(win: any) {
        const composePath = await this.getComposePath();
        await compose.stop({
            cwd: composePath,
            callback: (chunk) => {
                logger.info('job in progres: ', chunk.toString('utf8'));
                this.window.webContents.send('docker-log',
                    {
                        log: chunk.toString('utf8'),
                        object: 'statusUI'
                    });
            }
        })
            .then(
                () => {
                    logger.info('docker stop');
                    this.window.webContents.send('point-node-check');
                },
                (err: { message: any; }) => { logger.info('something went wrong:', err.message) }
            );
    }

    pointNodeCheck() {
        logger.info('node check')
        http.get("http://localhost:2468/v1/api/status/ping", (res) => {
            this.window.webContents.send("pointNode:checked", true)
            logger.info('node running')
        }).on('error', err => {
            logger.info(err);
            this.window.webContents.send("pointNode:checked", false)
        });
    }
};
