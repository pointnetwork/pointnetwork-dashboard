import {app, BrowserWindow, ipcMain} from 'electron';
import { SystemInfoChannel } from './Channels/SystemInfoChannel';
import { IpcChannelInterface } from './IpcChannelInterface';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string
class Main {

    
  private mainWindow?: BrowserWindow;

  public init(ipcChannels: IpcChannelInterface[]) {
    app.on('ready', this.createWindow);
    app.on('window-all-closed', this.onWindowAllClosed);
    app.on('activate', this.onActivate);

    this.registerIpcChannels(ipcChannels);
  }

  private registerIpcChannels(ipcChannels: IpcChannelInterface[]) {
    ipcChannels.forEach(channel => ipcMain.on(channel.getName(), (event, request) => channel.handle(event, request)));
  }

  private onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }

  private onActivate() {
    if (BrowserWindow.getAllWindows().length === 0) {
      this.createWindow();
    }
  }

  private createWindow() {
    this.mainWindow = new BrowserWindow({
      height: 600,
      width: 800,
      title: `Yet another Electron Application`,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
      }
    });

    this.mainWindow.webContents.openDevTools();
    this.mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)
  }
}

// Here we go!
(new Main()).init([
    new SystemInfoChannel()
]);