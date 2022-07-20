import {contextBridge, ipcRenderer} from 'electron';
// Types
import {
    UninstallerChannelsEnum,
    WelcomeChannelsEnum,
    DashboardChannelsEnum,
    GenericChannelsEnum
} from './../@types/ipc_channels';

declare global {
  // eslint-disable-next-line
  interface Window {
    Welcome: typeof api
  }
}

export const api = {
    // Welcome channels
    getMnemonic: () => ipcRenderer.send(WelcomeChannelsEnum.get_mnemonic),
    generateMnemonic: () =>
        ipcRenderer.send(WelcomeChannelsEnum.generate_mnemonic),
    validateMnemonic: (value: any) =>
        ipcRenderer.send(WelcomeChannelsEnum.validate_mnemonic, value),
    login: () => ipcRenderer.send(WelcomeChannelsEnum.login),
    copyMnemonic: (value: any) =>
        ipcRenderer.send(WelcomeChannelsEnum.copy_mnemonic, value),
    pasteMnemonic: () => ipcRenderer.send(WelcomeChannelsEnum.paste_mnemonic),
    getDictionary: () => ipcRenderer.send(WelcomeChannelsEnum.get_dictionary),
    pickWords: () => ipcRenderer.send(WelcomeChannelsEnum.pick_words),
    validateWords: (words: string[]) =>
        ipcRenderer.send(WelcomeChannelsEnum.validate_words, words),
    // Uninstaller channels
    launchUninstaller: () => ipcRenderer.send(UninstallerChannelsEnum.launch),
    // Dashboard channels
    getDashboardVersion: () =>
        ipcRenderer.send(DashboardChannelsEnum.get_version),
    // Generic channels
    getIdentifier: () => new Promise<string>((resolve) => {
        ipcRenderer.once(GenericChannelsEnum.get_identifier, (_, id: string) => {
            resolve(id);
        });
        ipcRenderer.send(GenericChannelsEnum.get_identifier);
    }),
    minimizeWindow: () => ipcRenderer.send(GenericChannelsEnum.minimize_window),
    closeWindow: () => ipcRenderer.send(GenericChannelsEnum.close_window),

    on: (channel: string, callback: (...args: unknown[]) => void) => {
        ipcRenderer.on(channel, (_, data) => callback(data));
    }
};

contextBridge.exposeInMainWorld('Welcome', api);
