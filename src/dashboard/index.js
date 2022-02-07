// Modules to control application life and create native browser window
const { app,
        BrowserWindow,
        ipcMain,
        nativeImage, globalShortcut
      } = require('electron');
const path = require('path');
const { platform, arch } = require('process');
const fs = require('fs-extra');
const { exec } = require('child_process');
const url = require('url');
const ipcHooks = require('./ipc-hooks');

let win;

class Dashboard {
    constructor() {
        
    }

    run() {
        let createWindow = () => {
            // Create the browser window.
            win = new BrowserWindow({
                width: 1000,
                height: 800,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    enableRemoteModule: false,
                    preload: path.join(__dirname, '..', 'src', 'dashboard', 'preload.js')
                }
            });

            // and load the index.html of the app.
            win.loadFile('./src/dashboard/app/app.html');

            // Open the DevTools.
             win.webContents.openDevTools();

            // Register Cmd+Q on macs
            if (process.platform === 'darwin') {
                globalShortcut.register('Command+Q', () => {
                    app.isQuiting = true;
                    app.quit();
                });
            }
        };

        // This method will be called when Electron has finished
        // initialization and is ready to create browser windows.
        // Some APIs can only be used after this event occurs.
        app.whenReady().then(() => {
            createWindow();

            app.on('activate', function () {
                // On macOS it's common to re-create a window in the app when the
                // dock icon is clicked and there are no other windows open.
                if (BrowserWindow.getAllWindows().length === 0) createWindow();
            });

            win.on('minimize',function(event){
                event.preventDefault();
                win.hide();
            });

            win.on('close', function (event) {
                if(!app.isQuiting){
                    event.preventDefault();
                    win.hide();
                }

                return false;
            });

            // Quit when all windows are closed, except on macOS. There, it's common
            // for applications and their menu bar to stay active until the user quits
            // explicitly with Cmd + Q.
            app.on('window-all-closed', function () {
                if (platform !== 'darwin') app.quit();
            });

            ipcHooks.attach(ipcMain, win, app);

        });
    }
}

module.exports = Dashboard;
