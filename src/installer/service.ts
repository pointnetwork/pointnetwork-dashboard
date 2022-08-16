import {BrowserWindow} from 'electron';
import {getProgressFromGithubMsg} from './helpers';
import rmfr from 'rmfr';
import Bounty from '../bounty';
import Node from '../node';
import Firefox from '../firefox';
import PointSDK from '../pointsdk';
import Uninstaller from '../uninstaller';
import Logger from '../../shared/logger';
import helpers from '../../shared/helpers';
// Types
import {GenericProgressLog} from './../@types/generic';
import {InstallerChannelsEnum} from '../@types/ipc_channels';
import {ErrorsEnum} from './../@types/errors';

import path from 'path';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs-extra';

const POINT_SRC_DIR = helpers.getPointSrcPath();
const POINT_LIVE_DIR = helpers.getLiveDirectoryPath();

const DIRECTORIES = [helpers.getPointSoftwarePath(), POINT_LIVE_DIR];

const REPOSITORIES = ['liveprofile'];

class Installer {
    private logger: Logger;
    private window: BrowserWindow;
    private _attempts = 0;
    private _stepsCompleted = 0;
    private static installationJsonFilePath: string = path.join(
        helpers.getPointPath(),
        'installer.json'
    );

    constructor(window: BrowserWindow) {
        this.logger = new Logger({
            window,
            module: 'installer'
        });
        this.window = window;
    }

    /**
   * Returns the installation status
   */
    static isInstalled = async () => {
        try {
            return JSON.parse(
                await fs.readFile(this.installationJsonFilePath, {
                    encoding: 'utf8',
                    flag: 'r'
                })
            ).isInstalled;
        } catch (error) {
            return false;
        }
    };

    /**
   * Creates dirs, clones repos, installs Point Engine, Firefox, Uninstaller, SDK, sends events to bounty server and saves the JSON file
   */
    install = async () => {
        try {
            this._attempts++;

            this.logger.info('Starting installation');

            const bounty = new Bounty({window: this.window});
            await bounty.init();

            await fs.writeFile(
                Installer.installationJsonFilePath,
                JSON.stringify({isInstalled: false})
            );

            await bounty.sendInstallStarted();
            if (this._stepsCompleted === 0) {
                await this._createDirs();
                this._stepsCompleted++;
            }
            if (this._stepsCompleted === 1) {
                await this._cloneRepos();
                this._stepsCompleted++;
            }
            if (this._stepsCompleted === 2) {
                await new Firefox({window: this.window}).downloadAndInstall();
                this._stepsCompleted++;
            }
            if (this._stepsCompleted === 3) {
                await new PointSDK({window: this.window}).downloadAndInstall();
                this._stepsCompleted++;
            }
            if (this._stepsCompleted === 4) {
                await new Node({window: this.window}).downloadAndInstall();
                this._stepsCompleted++;
            }
            if (this._stepsCompleted === 5) {
                await new Uninstaller({window: this.window}).downloadAndInstall();
            }

            await bounty.sendInstalled();

            await fs.writeFile(
                Installer.installationJsonFilePath,
                JSON.stringify({isInstalled: true})
            );
            this.logger.info('Installation complete');
        } catch (error) {
            this.logger.error({
                errorType: ErrorsEnum.INSTALLATION_ERROR,
                error
            });
            this.logger.sendToChannel({
                channel: InstallerChannelsEnum.error,
                log: this._attempts.toString()
            });
            throw error;
        }
    };

    /**
   * Closes the window
   */
    close() {
        this.window.close();
    }

    /**
   * Created the required directories
   */
    async _createDirs() {
        try {
            this.logger.info('Creating directories');
            this.logger.sendToChannel({
                channel: InstallerChannelsEnum.create_dirs,
                log: JSON.stringify({
                    started: true,
                    log: 'Creating required directories'
                } as GenericProgressLog)
            });

            await Promise.all(DIRECTORIES.map(async dir => {
                const total = DIRECTORIES.length;
                let created = 0;

                await fs.mkdir(dir, {recursive: true});

                created++;
                const progress = Math.round((created / total) * 100);

                this.logger.sendToChannel({
                    channel: InstallerChannelsEnum.create_dirs,
                    log: JSON.stringify({
                        progress,
                        log: `Created ${dir}`
                    } as GenericProgressLog)
                });
            }));

            this.logger.info('Created directories');
            this.logger.sendToChannel({
                channel: InstallerChannelsEnum.create_dirs,
                log: JSON.stringify({
                    started: false,
                    done: true,
                    progress: 100,
                    log: `Created required directories`
                } as GenericProgressLog)
            });
        } catch (error) {
            this.logger.sendToChannel({
                channel: InstallerChannelsEnum.create_dirs,
                log: JSON.stringify({
                    error: true,
                    log: 'Error creating directories'
                } as GenericProgressLog)
            });
            this.logger.error({errorType: ErrorsEnum.CREATE_DIRS_ERROR, error});
            throw error;
        }
    }

    /**
   * Clones the required repositories and copies the live profile
   */
    async _cloneRepos(): Promise<void> {
        try {
            this.logger.info('Cloning repositories');
            this.logger.sendToChannel({
                channel: InstallerChannelsEnum.clone_repos,
                log: JSON.stringify({
                    started: true,
                    log: 'Cloning the repositores'
                } as GenericProgressLog)
            });
            await Promise.all(
                REPOSITORIES.map(async repo => {
                    const dir = path.join(POINT_SRC_DIR, repo);
                    if (fs.existsSync(dir)) {
                        await rmfr(dir);
                    }
                    const githubURL = helpers.getGithubURL();
                    const url = `${githubURL}/pointnetwork/${repo}`;

                    await git.clone({
                        fs,
                        http,
                        dir,
                        url,
                        depth: 1,
                        onMessage: (msg: string) => {
                            const progressData = getProgressFromGithubMsg(msg);

                            if (progressData) {
                                const cap = 90; // Don't go to 100% since there are further steps.
                                const progress =
                  progressData.progress <= cap ? progressData.progress : cap;

                                this.logger.sendToChannel({
                                    channel: InstallerChannelsEnum.clone_repos,
                                    log: JSON.stringify({
                                        progress,
                                        log: `Cloning repo: ${url}`
                                    } as GenericProgressLog)
                                });
                            }
                        }
                    });
                    this.logger.info('Copying liveprofile');
                    this.logger.sendToChannel({
                        channel: InstallerChannelsEnum.clone_repos,
                        log: JSON.stringify({log: 'Copying live profile'} as GenericProgressLog)
                    });
                    await fs.copy(dir, path.join(POINT_LIVE_DIR, repo));
                    this.logger.info('Copied liveprofile');
                })
            );
            this.logger.info('Cloned repositories');
            this.logger.sendToChannel({
                channel: InstallerChannelsEnum.clone_repos,
                log: JSON.stringify({
                    started: false,
                    done: true,
                    progress: 100,
                    log: 'Cloned required repositories'
                } as GenericProgressLog)
            });
        } catch (error) {
            this.logger.sendToChannel({
                channel: InstallerChannelsEnum.clone_repos,
                log: JSON.stringify({
                    error: true,
                    log: 'Error cloning repositories'
                } as GenericProgressLog)
            });
            this.logger.error({errorType: ErrorsEnum.CLONE_REPOS_ERROR, error});
            throw error;
        }
    }
}

export default Installer;
