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
const Installer = require('./installer');
const Dashboard = require('./dashboard');
const Welcome = require('./welcome');
const helpers = require('./helpers');
const firefox = require('./firefox');
const docker = require('./docker');
const Tray = require('./tray');

let win;
let tray = null;

app.mainDecision = async() => {
    // if (! await helpers.isInstallationDone()) {
    //     const installer = new Installer();
    //     installer.run();
    // } else
    // if (! firefox.isInstalled()) {
    //     const installer = new Installer();
    //     installer.runFirefox();
    // }
    helpers.getPlatform();
    if (! await helpers.isLoggedIn()) {
        const welcome = new Welcome();
        welcome.run();
    } else {
        app.openDashboard();
    }
}

app.openDashboard = () => {
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.whenReady().then(async () => {
        tray = Tray.init();

        const dashboard = new Dashboard();
        dashboard.run();
    });

    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    app.on('window-all-closed', async function () {
        await docker.stopCompose();
        if (platform !== 'darwin') app.quit();
    });
}

setImmediate(app.mainDecision);
