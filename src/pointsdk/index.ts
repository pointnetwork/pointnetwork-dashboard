import {BrowserWindow} from 'electron';
import fs from 'fs-extra';
import moment from 'moment';
import path from 'node:path';
import helpers from '../../shared/helpers';
import Logger from '../../shared/logger';
import utils from '../../shared/utils';
// Types
import {PointSDKChannelsEnum} from '../@types/ipc_channels';
import {UpdateLog} from '../@types/generic';
import {ErrorsEnum} from './../@types/errors';

/**
 * WHAT THIS MODULE DOES
 * 1. Downloads and installs the Point SDK
 */
class PointSDK {
    logger: Logger;
    window: BrowserWindow;
    pointDir: string = helpers.getPointPath();

    constructor({window}: {window: BrowserWindow}) {
        this.window = window;
        this.logger = new Logger({window, module: 'point_sdk'});
    }

    /**
     * Returns the latest available version for Point Node
     */
    async getLatestVersion(): Promise<string> {
        return await helpers.getLatestReleaseFromGithub('pointsdk');
    }

    /**
     * Returns the download URL for the version provided and the file name provided
     */
    getDownloadURL(filename: string, version: string): string {
        return `${helpers.getGithubURL()}/pointnetwork/pointsdk/releases/download/${version}/${filename}`;
    }

    /**
     * Downloads and instals the Point SDK
     */
    downloadAndInstall(): Promise<void> {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                const latestVersion = await this.getLatestVersion();
                const filename = `point_network-${latestVersion.replace('v', '')}-an+fx.xpi`;
                const extensionsPath = helpers.getLiveExtensionsDirectoryPathResources();

                const downloadUrl = this.getDownloadURL(filename, latestVersion);
                const downloadPath = path.join(
                    extensionsPath,
                    `{c8388105-6543-4833-90c9-beb8c6b19d61}.xpi`
                );
                this.logger.info('Downloading SDK from', downloadUrl);

                const downloadStream = fs.createWriteStream(downloadPath);

                await helpers.setIsFirefoxInit(false);

                await utils.download({
                    channel: PointSDKChannelsEnum.download,
                    logger: this.logger,
                    downloadUrl,
                    downloadStream
                });

                this.logger.info('Saving "infoSDK.json"');
                await fs.writeFile(
                    path.join(this.pointDir, 'infoSDK.json'),
                    JSON.stringify({
                        installedReleaseVersion: latestVersion,
                        lastCheck: moment().unix()
                    }),
                    'utf8'
                );
                this.logger.info('Saved "infoSDK.json"');

                resolve();
            } catch (error) {
                this.logger.error({errorType: ErrorsEnum.POINTSDK_ERROR, error});
                reject(error);
            }
        });
    }

    /**
     * Checks for Point Node updates
     */
    async checkForUpdates() {
        try {
            this.logger.info('Checking for updates');
            this.logger.sendToChannel({
                channel: PointSDKChannelsEnum.check_for_updates,
                log: JSON.stringify({
                    isChecking: true,
                    isAvailable: false,
                    log: 'Checking for updates',
                    error: false
                } as UpdateLog)
            });
            const installInfo = await helpers.getInstalledVersionInfo('sdk');
            const latestVersion = await this.getLatestVersion();

            if (
                !installInfo.lastCheck ||
                (moment().diff(moment.unix(installInfo.lastCheck), 'hours') >= 1 &&
                    installInfo.installedReleaseVersion !== latestVersion)
            ) {
                this.logger.info('Update available');
                this.logger.sendToChannel({
                    channel: PointSDKChannelsEnum.check_for_updates,
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
                    channel: PointSDKChannelsEnum.check_for_updates,
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
                channel: PointSDKChannelsEnum.check_for_updates,
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
}

export default PointSDK;
