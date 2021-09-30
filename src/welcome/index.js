const {BrowserWindow, app, Tray, nativeImage, Menu, ipcMain, globalShortcut} = require("electron");
const path = require("path");
const fs = require("fs-extra");
const {platform, arch} = require("process");
const helpers = require("../helpers");
const {exec} = require("child_process");
const url = require("url");
const ipcHooks = require("./ipc-hooks");

//////////////// WELCOME ///////////////////

let win;

class Welcome {
    constructor() {
    }

    run() {
        let createWindow = () => {
            // Create the browser window.
            win = new BrowserWindow({
                width: 1000,
                height: 500,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    enableRemoteModule: false,
                    preload: path.join(__dirname, '..', 'src', 'welcome', 'preload.js')
                }
            });

            // and load the index.html of the app.
            win.loadFile('./src/welcome/app/app.html');

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

        // WARNING! Do not write anything important here, `win` variable is undefined, it hasn't been created through createWindow yet
    }
}

module.exports = Welcome;
