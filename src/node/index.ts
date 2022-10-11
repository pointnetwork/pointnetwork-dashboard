import {BrowserWindow} from 'electron';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'node:path';
import find from 'find-process';
import {spawn} from 'node:child_process';
import {https} from 'follow-redirects';
import moment from 'moment';
import rmfr from 'rmfr';
import {generate} from 'randomstring';
import utils from '../../shared/utils';
import Logger from '../../shared/logger';
import helpers from '../../shared/helpers';
// Types
import {NodeChannelsEnum} from '../@types/ipc_channels';
import {
    GenericProgressLog,
    IdentityLog,
    LaunchProcessLog,
    Process,
    UpdateLog
} from '../@types/generic';
import {ErrorsEnum} from '../@types/errors';
import {downloadAndVerifyFileIntegrity} from '../../shared/downloadAndVerifyFileIntegrity';
import ProcessError from '../../shared/ProcessError';

const decompress = require('decompress');
const decompressTargz = require('decompress-targz');

const PING_ERROR_THRESHOLD = 5;
const PING_INTERVAL = 1000;
const PING_TIMEOUT = 5000;
const MAX_RETRY_COUNT = 3;

// TODO: Add JSDoc comments
/**
 * WHAT THIS MODULE DOES
 * 1. Downloads Point Engine
 * 2. Checks if a new Point Engine release is available
 * 3. Launches Point Engine
 * 4. Kills Point Engine
 * 5. Returns the running identity
 * 6. Returns the status if Point Engine is running or not
 * 7. Returns the status if Point Engine exists or not
 */
class Node {
    logger: Logger;
    window: BrowserWindow;
    pointDir: string = helpers.getPointPath();
    pingErrorCount = 0;
    pointLaunchCount = 0;
    pingTimeout: NodeJS.Timeout | null = null;
    nodeRunning = false;

    constructor({window}: { window: BrowserWindow }) {
        this.window = window;
        this.logger = new Logger({window, module: 'point_node'});
    }

    /**
   * Clears the ping interval, if it was running
   */
    clearPingTimeout() {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
            this.pingTimeout = null;
        }
    }

    /**
   * Returns the latest available version for Point Engine
   */
    async getLatestVersion(): Promise<string> {
        this.logger.info('Getting latest version');
        return await helpers.getLatestReleaseFromGithub('pointnetwork', this.logger);
    }

    /**
   * Returns the download URL for the version provided and the file name provided
   */
    getDownloadURL(filename: string, version: string): string {
        return `${helpers.getGithubURL()}/pointnetwork/pointnetwork/releases/download/${version}/${filename}`;
    }

    /**
   * Downloads Point Engine binary from GitHub, extracts it to the .point directory, deletes the downloaded file, and saves the info to infoNode.json file
   */
    downloadAndInstall(): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                // Delete any residual files and stop any residual processes
                this.logger.info('Removing previous installations');

                if (fs.existsSync(path.join(this.pointDir, 'contracts'))) {
                    await rmfr(path.join(this.pointDir, 'contracts'));
                }
                if (fs.existsSync(path.join(this.pointDir, 'bin'))) {
                    await rmfr(path.join(this.pointDir, 'bin'));
                }

                // 1. Set the parameters for download
                const latestVersion = await this.getLatestVersion();
                let fileName = `point-linux-${latestVersion}.tar.gz`;
                if (global.platform.win32) {fileName = `point-win-${latestVersion}.tar.gz`;}
                if (global.platform.darwin) {fileName = `point-macos-${latestVersion}.tar.gz`;}

                const platform = fileName.split('-')[1];
                const downloadUrl = this.getDownloadURL(fileName, latestVersion);
                const downloadDest = path.join(this.pointDir, fileName);
                const sha256FileName = `sha256-${latestVersion}.txt`;
                const sumFileDest = path.join(this.pointDir, sha256FileName);
                const sumFileUrl = this.getDownloadURL(sha256FileName, latestVersion);

                this.logger.info('Downloading from', downloadUrl);

                try {
                    await downloadAndVerifyFileIntegrity({
                        platform,
                        downloadUrl,
                        downloadDest,
                        sumFileUrl,
                        sumFileDest,
                        logger: this.logger,
                        channel: NodeChannelsEnum.download
                    });
                } catch (e) {
                    // TODO: We stop the ping interval because we are considering this a critical error.
                    // It's the safest approach to avoid potentially running a corrupted file.
                    // We could download the new file to a temp folder, and only after validation
                    // replace the old one. So that if validation fails, we can keep running the old version.
                    this.clearPingTimeout();

                    this.logger.sendToChannel({
                        channel: NodeChannelsEnum.error,
                        log: JSON.stringify({
                            isRunning: false,
                            log: '14'
                        } as LaunchProcessLog)
                    });

                    this.logger.error({
                        errorType: ErrorsEnum.DOWNLOAD_ERROR,
                        error: e,
                        info: 'Could not download pointnode after many retries due to error'
                    });

                    throw e;
                }

                this.logger.info('Unpacking');
                // 3. Unpack the downloaded file and send logs to window
                this.logger.sendToChannel({
                    channel: NodeChannelsEnum.unpack,
                    log: JSON.stringify({
                        started: true,
                        log: 'Unpacking Point Engine',
                        done: false,
                        progress: 0,
                        error: false
                    } as GenericProgressLog)
                });
                try {
                    await decompress(downloadDest, this.pointDir, {plugins: [decompressTargz()]});
                } catch (error) {
                    this.logger.sendToChannel({
                        channel: NodeChannelsEnum.unpack,
                        log: JSON.stringify({
                            log: 'Error unpacking Point Engine',
                            error: true
                        } as GenericProgressLog)
                    });
                    this.logger.error({errorType: ErrorsEnum.UNPACK_ERROR, error});
                    throw error;
                }
                this.logger.sendToChannel({
                    channel: NodeChannelsEnum.unpack,
                    log: JSON.stringify({
                        started: false,
                        log: 'Unpacked Point Engine',
                        done: true,
                        progress: 100
                    } as GenericProgressLog)
                });
                this.logger.info('Unpacked');
                // 4. Delete the downloaded file
                this.logger.info('Removing downloaded file');
                await fs.unlink(downloadDest);
                this.logger.info('Removed downloaded file');

                // 5. Save infoNode.json file
                this.logger.info('Saving "infoNode.json"');
                await fs.writeFile(
                    path.join(this.pointDir, 'infoNode.json'),
                    JSON.stringify({
                        installedReleaseVersion: latestVersion,
                        lastCheck: moment().unix()
                    }),
                    'utf8'
                );
                this.logger.info('Saved "infoNode.json"');

                resolve();
            } catch (error) {
                this.logger.error({errorType: ErrorsEnum.NODE_ERROR, error});
                reject(error);
            }
        });
    }

    async generateAuthToken() {
        this.logger.info('Checking for auth token');
        const tokenFileName = helpers.getTokenFileName();
        if (fs.existsSync(tokenFileName)) {
            this.logger.info('Auth token already exists');
            return;
        }
        this.logger.info('Generating auth token');
        const token = generate();
        await fs.writeFile(tokenFileName, token);
        this.logger.info('Auth token successfully generated');
    }

    /**
   * Checks
   * 1. If Point Engine exists or not, if not then returns early
   * 2. Checks if there are any running instances of Point Engine, if yes then returns early
   * 3. Launches Point Engine
   */
    async launch() {
        try {
            this.logger.info('Launching point node');
            await this.generateAuthToken();
            if (!this.pingTimeout) {
                this.pingTimeout = setTimeout(this.ping.bind(this), PING_INTERVAL);
            }
            if (!fs.existsSync(await this._getBinFile())) {
                this.logger.error({
                    errorType: ErrorsEnum.LAUNCH_ERROR,
                    error: new Error('Trying to launch point node, but bin file does not exist')
                });
                return;
            }
            if ((await this._getRunningProcess()).length) {
                this.logger.info(
                    'Point node is currently running. Skipping starting it'
                );
                return;
            }
            if (this.pointLaunchCount >= MAX_RETRY_COUNT) {
                this.pointLaunchCount = 0;
                this.logger.sendToChannel({
                    channel: NodeChannelsEnum.running_status,
                    log: JSON.stringify({
                        isRunning: false,
                        relaunching: false,
                        launchFailed: false,
                        log: 'Point Engine is not running'
                    } as LaunchProcessLog)
                });
            } else {
                this.pointLaunchCount++;
            }
            const file = await this._getBinFile();
            const proc = spawn(file, {
                env: {
                    ...process.env,
                    NODE_ENV: 'production'
                },
                stdio: ['ignore', 'ignore', 'pipe']
            });

            proc.stderr.on('data', (data: string) => {
                this.logger.error({
                    errorType: ErrorsEnum.NODE_ERROR,
                    error: new Error(data),
                    info: 'Stderr output from node'
                });
            });

            proc.on('exit', code => {
                if (code === 0) {
                    this.logger.info('Point node process exited');
                } else {
                    // We only give special handling to `point error codes`, which are > 1.
                    // TODO: for now, we hardcode the codes we want to handle,
                    // we'll improve this when we have the `point-error-codes` shared repo.
                    if (code && [11, 13].includes(code)) {
                        // Critical error from Point Engine, stop the ping interval as they are unrecoverable.
                        this.clearPingTimeout();

                        this.logger.sendToChannel({
                            channel: NodeChannelsEnum.error,
                            log: JSON.stringify({
                                isRunning: false,
                                log: String(code)
                            } as LaunchProcessLog)
                        });
                    }

                    this.logger.error({
                        errorType: ErrorsEnum.NODE_ERROR,
                        error: new ProcessError('Point node process exited', code)
                    });
                }
            });
        } catch (error) {
            this.logger.error({errorType: ErrorsEnum.LAUNCH_ERROR, error});
            throw error;
        }
    }

    /**
   * Pings Point Engine and checks if it is ready to receive requests
   */
    async ping() {
        try {
            await axios.get('https://point/v1/api/status/meta', {
                timeout: PING_TIMEOUT,
                proxy: {
                    host: 'localhost',
                    port: 8666,
                    protocol: 'https'
                },
                httpsAgent: new https.Agent({rejectUnauthorized: false})
            });
            this.logger.sendToChannel({
                channel: NodeChannelsEnum.running_status,
                log: JSON.stringify({
                    isRunning: true,
                    relaunching: false,
                    launchFailed: false,
                    log: 'Point Engine is running'
                } as LaunchProcessLog)
            });
            this.pingErrorCount = 0;
            this.pointLaunchCount = 0;
            this.nodeRunning = true;
            this.pingTimeout = setTimeout(this.ping.bind(this), PING_INTERVAL);
        } catch (error) {
            this.pingErrorCount += 1;
            const relaunching = this.pingErrorCount > PING_ERROR_THRESHOLD;
            const launchFailed = this.pointLaunchCount >= MAX_RETRY_COUNT;
            if (relaunching || this.nodeRunning) {
                this.logger.error({
                    errorType: ErrorsEnum.NODE_ERROR,
                    error: new Error(this.nodeRunning
                        ? 'Node process was stopped, relaunching'
                        : `Unable to Ping after ${PING_ERROR_THRESHOLD} attempts`)
                });
                this.pingErrorCount = 0;
                if (!launchFailed) {
                    this.launch();
                }
            }
            this.nodeRunning = false;
            this.logger.sendToChannel({
                channel: NodeChannelsEnum.running_status,
                log: JSON.stringify({
                    isRunning: false,
                    relaunching,
                    launchFailed,
                    log: 'Point Engine is not running'
                } as LaunchProcessLog)
            });
            if (launchFailed) {
                this.clearPingTimeout();
            } else {
                this.pingTimeout = setTimeout(this.ping.bind(this), PING_INTERVAL);
            }
        }
    }

    /**
   * Stops the running instances of Point Engine
   */
    async stop() {
        this.logger.sendToChannel({
            channel: NodeChannelsEnum.stop,
            log: JSON.stringify({
                started: true,
                log: 'Finding running processes for Point Engine',
                done: false
            } as GenericProgressLog)
        });

        this.clearPingTimeout();

        const process = await this._getRunningProcess();
        if (process.length > 0) {
            this.logger.info('Stopping');
            for (const p of process) {
                try {
                    await utils.kill({processId: p.pid, onMessage: this.logger.info});
                } catch (error) {
                    this.logger.error({errorType: ErrorsEnum.STOP_ERROR, error});
                    throw error;
                }
            }
        }

        this.logger.sendToChannel({
            channel: NodeChannelsEnum.stop,
            log: JSON.stringify({
                started: true,
                log: 'Killed running processes for Point Engine',
                done: false
            } as GenericProgressLog)
        });

        this.logger.info('Stopped');
    }

    /**
   * Checks for Point Engine updates
   */
    async checkForUpdates() {
        try {
            this.logger.info('Checking for updates');
            this.logger.sendToChannel({
                channel: NodeChannelsEnum.check_for_updates,
                log: JSON.stringify({
                    isChecking: true,
                    isAvailable: false,
                    log: 'Checking for updates',
                    error: false
                } as UpdateLog)
            });
            const installInfo = await helpers.getInstalledVersionInfo('node');
            const isBinMissing = !fs.existsSync(await this._getBinFile());
            const latestVersion = await this.getLatestVersion();

            if (
                isBinMissing ||
                    !installInfo.lastCheck ||
        ((moment().diff(moment.unix(installInfo.lastCheck), 'hours') >= 1
            || helpers.isTestEnv()) &&
            installInfo.installedReleaseVersion !== latestVersion)
            ) {
                this.logger.info('Update available');
                this.logger.sendToChannel({
                    channel: NodeChannelsEnum.check_for_updates,
                    log: JSON.stringify({
                        isChecking: false,
                        isAvailable: true,
                        log: 'Update available. Proceeding to download the update',
                        error: false
                    } as UpdateLog)
                });
                return true;
            } else {
                this.logger.info('Already up to date');
                this.logger.sendToChannel({
                    channel: NodeChannelsEnum.check_for_updates,
                    log: JSON.stringify({
                        isChecking: false,
                        isAvailable: false,
                        log: 'Already up to date',
                        error: false
                    } as UpdateLog)
                });
                return false;
            }
        } catch (error) {
            this.logger.sendToChannel({
                channel: NodeChannelsEnum.check_for_updates,
                log: JSON.stringify({
                    isChecking: false,
                    isAvailable: true,
                    log: 'Failed to update',
                    error: true
                } as UpdateLog)
            });
            this.logger.error({errorType: ErrorsEnum.UPDATE_ERROR, error});
            throw error;
        }
    }

    /**
   * Returns the identity currently active on Point Engine
   */
    async getIdentityInfo(): Promise<{ address: string; identity: string }> {
        this.logger.sendToChannel({
            channel: NodeChannelsEnum.get_identity,
            log: JSON.stringify({
                isFetching: true,
                address: '',
                identity: '',
                log: 'Getting identity'
            } as IdentityLog)
        });
        try {
            let res = await axios.get(
                'http://localhost:2468/v1/api/wallet/address',
                {headers: {'X-Point-Token': `Bearer ${await helpers.generateAuthJwt()}`}}
            );
            const address = res.data.data.address;

            res = await axios.get(
                `http://localhost:2468/v1/api/identity/ownerToIdentity/${address}`,
                {headers: {'X-Point-Token': `Bearer ${await helpers.generateAuthJwt()}`}}
            );
            const identity = res.data.data.identity;
            this.logger.sendToChannel({
                channel: NodeChannelsEnum.get_identity,
                log: JSON.stringify({
                    isFetching: false,
                    address,
                    identity,
                    log: 'Identity fetched'
                } as IdentityLog)
            });
            return {address, identity};
        } catch (e) {
            this.logger.error({
                errorType: ErrorsEnum.NODE_ERROR,
                error: e,
                info: 'Unable to fetch identity info'
            });
            throw e;
        }
    }

    /**
   * Returns the running instances of Point Engine
   */
    async _getRunningProcess(): Promise<Process[]> {
        return (await find('name', 'point', true)).filter(p =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (p as any).bin.match(/bin.+?point(.exe)?$/)
        );
    }

    /**
   * Returns the path where the downloaded Point Engine executable exists
   */
    async _getBinFile(): Promise<string> {
        const binPath = await helpers.getBinPath();
        if (global.platform.win32) return path.join(binPath, 'win', 'point.exe');
        if (global.platform.darwin) return path.join(binPath, 'macos', 'point');
        return path.join(binPath, 'linux', 'point');
    }
}

export default Node;
