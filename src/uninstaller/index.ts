import {BrowserWindow} from 'electron';
import fs, {PathLike} from 'fs-extra';
import {exec} from 'node:child_process';
import path from 'node:path';
import rmfr from 'rmfr';
import Logger from '../../shared/logger';
import helpers from '../../shared/helpers';
import utils from '../../shared/utils';
// Types
import {ErrorsEnum} from '../@types/errors';
import {UninstallerChannelsEnum} from '../@types/ipc_channels';
import {GenericProgressLog, LaunchProcessLog} from '../@types/generic';

const decompress = require('decompress');
const decompressTargz = require('decompress-targz');

// TODO: Add JSDoc comments
/**
 * WHAT THIS MODULE DOES
 * 1. Downloads the Point Uninstaller
 * 2. Checks for updates whether new Point Uninstaller release is available
 * 3. Launches the Point Uninstaller
 */
class Uninstaller {
    logger: Logger;
    window: BrowserWindow;
    pointDir: string = helpers.getPointPath();

    constructor({window}: { window: BrowserWindow }) {
        this.window = window;
        this.logger = new Logger({window, module: 'uninstaller'});
    }

    /**
   * Returns the latest available version for Point Node
   */
    async getLatestVersion(): Promise<string> {
        return await helpers.getLatestReleaseFromGithub('pointnetwork-uninstaller');
    }

    /**
   * Returns the download URL for the version provided and the file name provided
   */
    getDownloadURL(filename: string, version: string): string {
        return `${helpers.getGithubURL()}/pointnetwork/pointnetwork-uninstaller/releases/download/${version}/${filename}`;
    }

    /**
   * Downloads the Point Uninstaller binary from GitHub, extracts it to the .temp directory, deletes the downloaded file
   */
    downloadAndInstall(): Promise<void> {
    // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                // 1. Set the parameters for download
                const latestVersion = await this.getLatestVersion();
                let filename = `point-uninstaller-${latestVersion}-Linux-Debian-Ubuntu.tar.gz`;
                if (global.platform.win32) {filename = `point-uninstaller-${latestVersion}-Windows-installer.zip`;}
                if (global.platform.darwin) {filename = `point-uninstaller-${latestVersion}-MacOS-portable.tar.gz`;}

                const downloadUrl = this.getDownloadURL(filename, latestVersion);
                const downloadDest = path.join(this.pointDir, filename);
                this.logger.info('Downloading from', downloadUrl);

                const downloadStream = fs.createWriteStream(downloadDest);

                // 2. Start downloading and send logs to window
                await utils.download({
                    channel: UninstallerChannelsEnum.download,
                    logger: this.logger,
                    downloadUrl,
                    downloadStream
                });

                // 3. Unpack the downloaded file and send logs to window
                const temp = helpers.getPointPathTemp();
                if (fs.existsSync(temp)) {
                    await rmfr(temp);
                }
                await fs.mkdirp(temp);

                try {
                    this.logger.info('Unpacking');
                    this.logger.sendToChannel({
                        channel: UninstallerChannelsEnum.unpack,
                        log: JSON.stringify({
                            started: true,
                            log: 'Unpacking Point Uninstaller',
                            done: false,
                            progress: 0,
                            error: false
                        } as GenericProgressLog)
                    });
                    if (global.platform.win32) {
                        await utils.extractZip({
                            src: downloadDest,
                            dest: temp,
                            onProgress: (progress: number) => {
                                this.logger.sendToChannel({
                                    channel: UninstallerChannelsEnum.unpack,
                                    log: JSON.stringify({
                                        started: true,
                                        log: 'Unpacking Point Uninstaller',
                                        done: false,
                                        progress
                                    } as GenericProgressLog)
                                });
                            }
                        });
                    }

                    if (global.platform.darwin) {
                        await decompress(
                            downloadDest,
                            this.pointDir,
                            {plugins: [decompressTargz()]}
                        );
                    }

                    if (global.platform.linux) {
                        // TODO: Add code for linux
                    }

                    this.logger.info('Unpacked');
                    this.logger.sendToChannel({
                        channel: UninstallerChannelsEnum.unpack,
                        log: JSON.stringify({
                            started: false,
                            log: 'Unpacked Point Uninstaller',
                            done: true,
                            progress: 100
                        } as GenericProgressLog)
                    });
                } catch (error) {
                    this.logger.sendToChannel({
                        channel: UninstallerChannelsEnum.unpack,
                        log: JSON.stringify({
                            error: true,
                            log: 'Error unpacking Point Uninstaller'
                        } as GenericProgressLog)
                    });
                    this.logger.error({errorType: ErrorsEnum.UNPACK_ERROR, error});
                }

                // 4. Delete the downloaded file
                this.logger.info('Removing downloaded file');
                await fs.unlink(downloadDest);
                this.logger.info('Removed downloaded file');

                resolve();
            } catch (error) {
                this.logger.error({errorType: ErrorsEnum.UNINSTALLER_ERROR, error});
                reject(error);
            }
        });
    }

    /**
   * Checks
   * 1. If Point Node exists or not, if it doesn't then downloads it
   * 2. Launches the Point Uninstaller
   */
    async launch() {
        const binFile = this._getBinFile();
        if (binFile && !fs.existsSync(binFile!)) await this.downloadAndInstall();

        let cmd;
        if (global.platform.win32) cmd = `start ${binFile}`;
        if (global.platform.darwin) cmd = `open ${binFile}`;

        if (cmd) {
            this.logger.sendToChannel({
                channel: UninstallerChannelsEnum.running_status,
                log: JSON.stringify({
                    isRunning: true,
                    log: 'Point Uninstaller is running'
                } as LaunchProcessLog)
            });
            this.logger.info('Launching');
            return exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    this.logger.error({errorType: ErrorsEnum.LAUNCH_ERROR, error});
                }
                // TODO: refactor with spawn and log exit code
                if (stderr) {
                    this.logger.error({
                        errorType: ErrorsEnum.LAUNCH_ERROR,
                        error: new Error(`Stderr output from uninstaller: ${stderr}`)
                    });
                }
                if (stdout) this.logger.info('Ran successfully');
                this.logger.sendToChannel({
                    channel: UninstallerChannelsEnum.running_status,
                    log: JSON.stringify({
                        isRunning: false,
                        log: 'Point Uninstaller closed'
                    } as LaunchProcessLog)
                });
            });
        }
    }

    /**
   * Returns the path where the downloaded Point Uninstaller executable exists
   */
    _getBinFile(): PathLike | undefined {
        const binPath = helpers.getPointPathTemp();
        const file = path.join(binPath, 'pointnetwork-uninstaller');

        if (global.platform.win32) return `${file}.exe`;
        if (global.platform.darwin) return `${file}.app`;
    }
}

export default Uninstaller;
