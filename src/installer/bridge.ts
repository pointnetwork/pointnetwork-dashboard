import {contextBridge, ipcRenderer} from 'electron';
import {DashboardChannelsEnum, GenericChannelsEnum} from '../@types/ipc_channels';
import {InstallerChannelsEnum} from './../@types/ipc_channels';

declare global {
    // eslint-disable-next-line
    interface Window {
        Installer: typeof api;
    }
}

export const api = {
    startInstallation: () => {
        ipcRenderer.send(InstallerChannelsEnum.start);
    },
    getDashboardVersion: () =>
        new Promise<string>(resolve => {
            ipcRenderer.once(DashboardChannelsEnum.get_version, (_, v: string) => {
                resolve(v);
            });
            ipcRenderer.send(DashboardChannelsEnum.get_version);
        }),
    getIdentifier: () =>
        new Promise<string>(resolve => {
            ipcRenderer.once(GenericChannelsEnum.get_identifier, (_, id: string) => {
                resolve(id);
            });
            ipcRenderer.send(GenericChannelsEnum.get_identifier);
        }),
    minimizeWindow: () => {
        ipcRenderer.send(GenericChannelsEnum.minimize_window);
    },
    closeWindow: () => {
        ipcRenderer.send(GenericChannelsEnum.close_window);
    },
    openTermsAndConditions: () => ipcRenderer.send(InstallerChannelsEnum.open_terms_link),
    openExternalLink: (link: string) =>
        ipcRenderer.send(GenericChannelsEnum.open_external_link, link),

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on: (channel: string, callback: (...args: any[]) => void) => {
        ipcRenderer.on(channel, (_, data) => callback(data));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    once: (channel: string, callback: (...args: any[]) => void) => {
        ipcRenderer.once(channel, (_, data) => callback(data));
    }
};

contextBridge.exposeInMainWorld('Installer', api);
