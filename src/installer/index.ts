import {InstallerChannelsEnum} from './../@types/ipc_channels';
import {app, BrowserWindow, ipcMain, shell} from 'electron';
import welcome from '../welcome';
import baseWindowConfig from '../../shared/windowConfig';
import Logger from '../../shared/logger';
import Installer from './service';
import helpers from '../../shared/helpers';
import {getIdentifier} from '../../shared/getIdentifier';
// Types
import {DashboardChannelsEnum, GenericChannelsEnum} from '../@types/ipc_channels';
import {ErrorsEnum} from '../@types/errors';
import {EventListener} from '../@types/generic';

export {Installer};

const logger = new Logger({module: 'installer_window'});

app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null;
let installer: Installer | null;

declare const INSTALLER_WINDOW_WEBPACK_ENTRY: string;
declare const INSTALLER_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

export default async function () {
    async function createWindow() {
        mainWindow = new BrowserWindow({
            ...baseWindowConfig,
            width: 640,
            height: 480,
            webPreferences: {
                ...baseWindowConfig.webPreferences,
                preload: INSTALLER_WINDOW_PRELOAD_WEBPACK_ENTRY
            }
        });

        installer = new Installer(mainWindow!);

        mainWindow.loadURL(INSTALLER_WINDOW_WEBPACK_ENTRY);

        mainWindow.on('close', async () => {
            logger.info('Closing Installer Window');
            logger.info('Removing all event listeners');
            await removeListeners();
            logger.info('Removed all event listeners');
        });

        mainWindow.on('closed', () => {
            mainWindow = null;
            installer = null;

            logger.info('Closed Installer Window');
        });
    }

    const events: EventListener[] = [
        // Installer channels
        {
            channel: InstallerChannelsEnum.start,
            async listener() {
                try {
                    await installer!.install();
                    await welcome();
                    installer!.close();
                } catch (error) {
                    logger.error({
                        errorType: ErrorsEnum.INSTALLATION_ERROR,
                        error
                    });
                }
            }
        },
        {
            channel: InstallerChannelsEnum.open_terms_link,
            async listener() {
                try {
                    shell.openExternal('https://pointnetwork.io/page/terms');
                } catch (error) {
                    logger.error({
                        errorType: ErrorsEnum.DASHBOARD_ERROR,
                        error
                    });
                }
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
        // Dashboard channels
        {
            channel: DashboardChannelsEnum.get_version,
            listener() {
                mainWindow!.webContents.send(
                    DashboardChannelsEnum.get_version,
                    helpers.getInstalledDashboardVersion()
                );
            }
        },
        // Generic channels
        {
            channel: GenericChannelsEnum.get_identifier,
            listener() {
                mainWindow!.webContents.send(
                    GenericChannelsEnum.get_identifier,
                    getIdentifier()[0]
                );
            }
        },
        {
            channel: GenericChannelsEnum.minimize_window,
            listener() {
                mainWindow!.minimize();
            }
        },
        {
            channel: GenericChannelsEnum.close_window,
            listener() {
                mainWindow!.close();
            }
        }
    ];

    async function registerListeners() {
        events.forEach(event => {
            ipcMain.on(event.channel, event.listener);
            logger.info('Registered event', event.channel);
        });
    }

    const removeListeners = async () => {
        events.forEach(event => {
            ipcMain.off(event.channel, event.listener);
            logger.info('Removed event listener', event.channel);
        });
    };

    const start = async () => {
        await registerListeners();
        await createWindow();
    };

    try {
        await app.whenReady();
        await start();
    } catch (error) {
        logger.error({
            errorType: ErrorsEnum.FATAL_ERROR,
            error,
            info: 'Failed to start Installer window'
        });
        app.quit();
    }
}
