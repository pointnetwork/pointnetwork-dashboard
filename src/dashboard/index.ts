import {UpdateLog} from './../@types/generic';
import {app, BrowserWindow, clipboard, ipcMain, shell} from 'electron';
import axios from 'axios';
import Bounty from '../bounty';
import Firefox from '../firefox';
import Node from '../node';
import PointSDK from '../pointsdk';
import Uninstaller from '../uninstaller';
import Logger from '../../shared/logger';
import helpers from '../../shared/helpers';
import welcome from '../welcome';
import {getIdentifier} from '../../shared/getIdentifier';
import baseWindowConfig from '../../shared/windowConfig';
// Types
import {
    BountyChannelsEnum,
    DashboardChannelsEnum,
    FirefoxChannelsEnum,
    GenericChannelsEnum,
    NodeChannelsEnum,
    UninstallerChannelsEnum
} from '../@types/ipc_channels';
import {EventListener} from '../@types/generic';
import {ErrorsEnum} from '../@types/errors';

let window: BrowserWindow | null;
let node: Node | null;
let firefox: Firefox | null;
let pointSDK: PointSDK | null;
let uninstaller: Uninstaller | null;

declare const DASHBOARD_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const DASHBOARD_WINDOW_WEBPACK_ENTRY: string;

const logger = new Logger({module: 'dashboard_window'});

export default async function () {
    async function createWindow() {
        window = new BrowserWindow({
            ...baseWindowConfig,
            width: 860,
            height: 560,
            webPreferences: {
                ...baseWindowConfig.webPreferences,
                preload: DASHBOARD_WINDOW_PRELOAD_WEBPACK_ENTRY
            }
        });

        firefox = new Firefox({window});
        node = new Node({window});
        pointSDK = new PointSDK({window});
        uninstaller = new Uninstaller({window});

        window.on('close', async ev => {
            ev.preventDefault();
            await shutdownResources();
            window?.destroy();
        });

        window.on('closed', () => {
            node = null;
            firefox = null;
            window = null;
        });

        await window.loadURL(DASHBOARD_WINDOW_WEBPACK_ENTRY);
    }

    /**
   * Useful where we want to do some cleanup before closing the window
   */
    const shutdownResources = async () => {
        logger.info('Removing all event listeners');
        await removeListeners();
        logger.info('Removed all event listeners');

        try {
            await Promise.all([
        node!.stop(),
        firefox!.stop()
            ]);
        } catch (error) {
            logger.error({
                errorType: ErrorsEnum.STOP_ERROR,
                error
            });
        }
    };

    const checkForUpdates = async () => {
        await Promise.all([
            (async () => {
                const nodeUpdateAvailable = await node!.checkForUpdates();
                if (nodeUpdateAvailable) {
                    await node?.downloadAndInstall();
                }
            })(),
            (async () => {
                const firefoxUpdateAvailable = await firefox!.checkForUpdates();
                if (firefoxUpdateAvailable) {
                    await firefox?.downloadAndInstall();
                }
            })(),
            (async () => {
                const sdkUpdateAvailable = await pointSDK!.checkForUpdates();
                if (sdkUpdateAvailable) {
                    await pointSDK?.downloadAndInstall();
                }
            })(),
            // TODO: notify the UI and handle it same way as for node, ff and sdk
            (async () => {
                if (!global.platform.darwin) { // TODO: why not darwin?
                    try {
                        const latestDashboardV = await helpers.getLatestReleaseFromGithub(
                            'pointnetwork-dashboard'
                        );
                        const installedDashboardV =
                await helpers.getInstalledDashboardVersion();

                        if (latestDashboardV > `v${installedDashboardV}`) {
                            window?.webContents.send(
                                DashboardChannelsEnum.check_for_updates,
                                JSON.stringify({
                                    isAvailable: true,
                                    isChecking: false
                                } as UpdateLog)
                            );
                        }
                    } catch (error) {
                        logger.error({
                            errorType: ErrorsEnum.UPDATE_ERROR,
                            error,
                            info: 'Failed to check for dashboard updates'
                        });
                    }
                }
            })()
        ]);
    };

    const checkForUpdatesAndLaunchNode = async () => {
        try {
            await checkForUpdates();
            window?.webContents.send(
                GenericChannelsEnum.check_for_updates,
                JSON.stringify({success: true})
            );
        } catch (e) {
            window?.webContents.send(
                GenericChannelsEnum.check_for_updates,
                JSON.stringify({success: false})
            );
            return;
        }
        await node!.launch();
    };

    const checkBalance = async () => {
        let balance = 0;
        const addressRes = await axios.get(
            'http://localhost:2468/v1/api/wallet/address'
        );
        const address = addressRes.data.data.address;

        const faucetURL = helpers.getFaucetURL();
        const res = await axios.get(`${faucetURL}/balance?address=${address}`);
        if (res.data?.balance && !isNaN(res.data.balance)) {
            balance = res.data.balance;
        } else {
            logger.error({
                errorType: ErrorsEnum.DASHBOARD_ERROR,
                error: new Error(`Unexpected balance response: ${res.data}`)
            });
        }
        window?.webContents.send(
            DashboardChannelsEnum.check_balance_and_airdrop,
            balance
        );
        return balance;
    };

    const events: EventListener[] = [
    // Bounty channels
        {
            channel: BountyChannelsEnum.send_generated,
            listener() {
                try {
                    new Bounty({window: window!}).sendGenerated();
                } catch (error) {
                    logger.error({errorType: ErrorsEnum.DASHBOARD_ERROR, error});
                }
            }
        },
        // Dashboard channels
        {
            channel: DashboardChannelsEnum.log_out,
            async listener() {
                try {
                    window?.webContents.send(DashboardChannelsEnum.log_out);
                    await shutdownResources();
                    await helpers.logout();
                    await welcome();
          window!.close();
                } catch (error) {
                    logger.error({errorType: ErrorsEnum.DASHBOARD_ERROR, error});
                }
            }
        },
        {
            channel: DashboardChannelsEnum.get_version,
            async listener() {
                try {
                    window?.webContents.send(
                        DashboardChannelsEnum.get_version,
                        helpers.getInstalledDashboardVersion()
                    );
                } catch (error) {
                    logger.error({errorType: ErrorsEnum.DASHBOARD_ERROR, error});
                }
            }
        },
        {
            channel: DashboardChannelsEnum.check_balance,
            async listener() {
                try {
                    await checkBalance();
                } catch (error) {
                    logger.error({errorType: ErrorsEnum.DASHBOARD_ERROR, error});
                }
            }
        },
        {
            channel: DashboardChannelsEnum.check_balance_and_airdrop,
            async listener() {
                // TODO: move this func somewhere to utils
                const delay = (ms: number) =>
                    new Promise(resolve => {
                        setTimeout(resolve, ms);
                    });
                const start = new Date().getTime();
                try {
                    const addressRes = await axios.get(
                        'http://localhost:2468/v1/api/wallet/address'
                    );
                    const address = addressRes.data.data.address;

                    const requestAirdrop = async () => {
                        const faucetURL = helpers.getFaucetURL();
                        logger.info('Airdropping wallet address with POINTS');
                        try {
                            await axios.get(`${faucetURL}/airdrop?address=${address}`);
                        } catch (error) {
                            logger.error({errorType: ErrorsEnum.DASHBOARD_ERROR, error});
                        }
                    };

                    let balance = await checkBalance();

                    // eslint-disable-next-line no-unmodified-loop-condition
                    while (balance <= 0) {
                        if (new Date().getTime() - start > 120000) {
                            throw new Error(
                                'Could not get positive wallet balance in 2 minutes'
                            );
                        }
                        await requestAirdrop();
                        await delay(10000);
                        balance = await checkBalance();
                    }
                } catch (error) {
                    logger.error({errorType: ErrorsEnum.DASHBOARD_ERROR, error});
                }
            }
        },
        // Uninstaller channels
        {
            channel: UninstallerChannelsEnum.launch,
            async listener() {
                try {
                    await uninstaller?.launch();
                } catch (error) {
                    logger.error({errorType: ErrorsEnum.DASHBOARD_ERROR, error});
                }
            }
        },
        // Firefox channels
        {
            channel: FirefoxChannelsEnum.launch,
            async listener() {
                try {
                    await firefox?.launch();
                } catch (error) {
                    logger.error({errorType: ErrorsEnum.DASHBOARD_ERROR, error});
                }
            }
        },
        {
            channel: FirefoxChannelsEnum.get_version,
            async listener() {
                const version = (await helpers.getInstalledVersionInfo('firefox'))
                    .installedReleaseVersion;
                window?.webContents.send(FirefoxChannelsEnum.get_version, version);
            }
        },
        // Node channels
        {
            channel: NodeChannelsEnum.launch,
            async listener() {
                try {
                    await node?.launch();
                } catch (error) {
                    logger.error({errorType: ErrorsEnum.DASHBOARD_ERROR, error});
                }
            }
        },
        {
            channel: NodeChannelsEnum.get_identity,
            async listener() {
                try {
                    await node?.getIdentityInfo();
                } catch (error) {
                    logger.error({errorType: ErrorsEnum.DASHBOARD_ERROR, error});
                }
            }
        },
        {
            channel: NodeChannelsEnum.get_version,
            async listener() {
                const version = (await helpers.getInstalledVersionInfo('node'))
                    .installedReleaseVersion;
                window?.webContents.send(NodeChannelsEnum.get_version, version);
            }
        },
        // Generic channels
        {
            channel: GenericChannelsEnum.get_identifier,
            listener() {
                window?.webContents.send(
                    GenericChannelsEnum.get_identifier,
                    getIdentifier()[0]
                );
            }
        },
        {
            channel: GenericChannelsEnum.copy_to_clipboard,
            listener(_, message: string) {
                clipboard.writeText(message);
                window?.webContents.send(GenericChannelsEnum.copy_to_clipboard);
            }
        },
        {
            channel: GenericChannelsEnum.open_external_link,
            async listener(_, link: string) {
                try {
                    await shell.openExternal(link);
                } catch (error) {
                    logger.error({errorType: ErrorsEnum.DASHBOARD_ERROR, error});
                }
            }
        },
        {
            channel: GenericChannelsEnum.check_for_updates,
            listener: checkForUpdatesAndLaunchNode
        },
        {
            channel: GenericChannelsEnum.close_window,
            async listener() {
                window?.webContents.send(DashboardChannelsEnum.closing);
                window?.close();
            }
        },
        {
            channel: GenericChannelsEnum.minimize_window,
            listener() {
                window?.minimize();
            }
        }
    ];

    const registerListeners = () => {
        events.forEach(event => {
            ipcMain.on(event.channel, event.listener);
            logger.info('Registered event', event.channel);
        });
    };

    const removeListeners = () => {
        events.forEach(event => {
            ipcMain.off(event.channel, event.listener);
            logger.info('Removed event listener', event.channel);
        });
    };

    app.on('will-quit', async function () {
    // This is a good place to add tests insuring the app is still
    // responsive and all windows are closed.
        logger.info('Dashboard Window "will-quit" event');
    });

    const start = async () => {
        registerListeners();
        await createWindow();
        await checkForUpdatesAndLaunchNode();
    };

    try {
        await app.whenReady();
        await start();
    } catch (error) {
        logger.error({
            errorType: ErrorsEnum.FATAL_ERROR,
            error,
            info: 'Failed to start Dashboard window'
        });
        app.quit();
    }
}
