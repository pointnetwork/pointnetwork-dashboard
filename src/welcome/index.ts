import {app, BrowserWindow, clipboard, ipcMain} from 'electron';
import WelcomeService from './service';
import dashboard from '../dashboard';
import baseWindowConfig from '../../shared/windowConfig';
import Logger from '../../shared/logger';
import helpers from '../../shared/helpers';
import {getIdentifier} from '../../shared/getIdentifier';
// Types
import {
    DashboardChannelsEnum,
    GenericChannelsEnum,
    WelcomeChannelsEnum
} from '../@types/ipc_channels';
import {ErrorsEnum} from '../@types/errors';

const logger = new Logger({module: 'welcome_window'});

let window: BrowserWindow | null;
let welcomeService: WelcomeService | null;

declare const WELCOME_WINDOW_PRELOAD_WEBPACK_ENTRY: string;
declare const WELCOME_WINDOW_WEBPACK_ENTRY: string;

export default async function () {
    async function createWindow() {
        window = new BrowserWindow({
            ...baseWindowConfig,
            width: 960,
            height: 560,
            webPreferences: {
                ...baseWindowConfig.webPreferences,
                preload: WELCOME_WINDOW_PRELOAD_WEBPACK_ENTRY
            }
        });

        welcomeService = new WelcomeService(window!);

        window.on('close', () => {
            logger.info('Closing Welcome Window');
            logger.info('Removing all event listeners');
            removeListeners();
            logger.info('Removed all event listeners');
        });

        window.on('closed', () => {
            logger.info('Closed Welcome Window');
            window = null;
            welcomeService = null;
        });

        await window.loadURL(WELCOME_WINDOW_WEBPACK_ENTRY);
    }

    const events = [
    // Welcome channels
        {
            channel: WelcomeChannelsEnum.generate_mnemonic,
            listener() {
        welcomeService!.generate();
            }
        },
        {
            channel: WelcomeChannelsEnum.get_mnemonic,
            listener() {
        welcomeService!.getGeneratedMnemonic();
            }
        },
        {
            channel: WelcomeChannelsEnum.pick_words,
            listener() {
        welcomeService!.pickRandomWords();
            }
        },
        {
            channel: WelcomeChannelsEnum.validate_words,
            listener(_: any, words: string[]) {
        welcomeService!.verifyWords(words);
            }
        },
        {
            channel: WelcomeChannelsEnum.validate_mnemonic,
            listener(_: any, message: string) {
        welcomeService!.validate(message.replace(/^\s+|\s+$/g, ''));
            }
        },
        {
            channel: WelcomeChannelsEnum.copy_mnemonic,
            listener(_: any, message: string) {
                clipboard.writeText(message);
                window?.webContents.send(WelcomeChannelsEnum.copy_mnemonic);
            }
        },
        {
            channel: WelcomeChannelsEnum.paste_mnemonic,
            listener() {
                window?.webContents.send(
                    WelcomeChannelsEnum.paste_mnemonic,
                    clipboard.readText('clipboard').toLowerCase()
                );
            }
        },
        {
            channel: WelcomeChannelsEnum.login,
            async listener() {
                const result = await welcomeService!.login();
                if (result) {
                    await dashboard();
                    window?.close();
                }
            }
        },
        {
            channel: WelcomeChannelsEnum.get_dictionary,
            listener() {
        welcomeService!.getDictionary();
            }
        },
        // Dashboard channels
        {
            channel: DashboardChannelsEnum.get_version,
            listener() {
        window!.webContents.send(
            DashboardChannelsEnum.get_version,
            helpers.getInstalledDashboardVersion()
        );
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
            channel: GenericChannelsEnum.minimize_window,
            listener() {
        window!.minimize();
            }
        },
        {
            channel: GenericChannelsEnum.close_window,
            listener() {
        window!.close();
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

    const start = async () => {
        registerListeners();
        await createWindow();
    };

    try {
        await app.whenReady();
        await start();
    } catch (error) {
        logger.error({
            errorType: ErrorsEnum.FATAL_ERROR,
            error,
            info: 'Failed to start Welcome window'
        });
        app.quit();
    }
}
