// Modules to control application life and create native browser window
const { app,
        BrowserWindow,
        ipcMain,
        Menu,
        Tray,
        nativeImage
      } = require('electron');
const path = require('path');
const { platform, arch } = require('process');
const fs = require('fs-extra');
const { exec } = require('child_process');
const url = require('url');

const helpers = require('helpers');
const firefox = require('firefox');
const docker = require('docker');

let win;
let tray = null;

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({
        width: 1000,
        height: 400,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // and load the index.html of the app.
    win.loadFile('index.html');

    // Open the DevTools.
    // win.webContents.openDevTools()
}

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

    // Tray stuff.
    const iconPath = path.join(__dirname, 'resources/logo.ico');
    tray = new Tray(nativeImage.createFromPath(iconPath));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show App', click:  function(){
            win.show();
        } },
        { label: 'Quit', click:  function(){
            app.isQuiting = true;
            app.quit();
        } }
    ]);
    tray.setToolTip('This is my application.');
    tray.setContextMenu(contextMenu);
    tray.on('right-click', () => {
        tray.popUpContextMenu();
    });
    tray.on('click', () => {
        win.show();
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
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (platform !== 'darwin') app.quit();
});

ipcMain.on("firefox-check", async (event, args) => {
    if (firefox.isInstalled()) {
        win.webContents.send("firefox-checked", true);
        return;
    }
    win.webContents.send("firefox-checked", false);
});

ipcMain.on("docker-check", async (event, args) => {
    const containerName = args.container;
    const osAndArch = helpers.getOSAndArch();
    const cmd = await docker.getHealthCmd(osAndArch, containerName);

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            win.webContents.send("docker-checked", {...args, status: 'not running'});
            return;
        }

        const resp = JSON.parse(stdout);
        const status = resp != null ? resp.Status : 'no connection';
        win.webContents.send("docker-checked", {status: status, ...args});
    });
});

ipcMain.on("docker-logs", async (event, args) => {
    const containerName = args.container;
    const cmd = `x-terminal-emulator -e docker-compose -f ${compose} -f ${composeDev} logs -f ${containerName} && bash || bash`;
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
    });
});

ipcMain.on("platform-check", async (event, args) => {
    win.webContents.send("platform-checked", {os: platform, arch: arch});
});

ipcMain.on("firefox-run", (event, args) => {
    const cmd = firefox.getBinPath(helpers.getOSAndArch());
    exec(cmd, (error, stdout, stderr) => {
        win.webContents.send("firefox-closed");
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
});

ipcMain.on("firefox-download", async (event, args) => {
    const language = args.language;
    const version = '93.0b4';
    const browserDir = path.join('.', 'point-browser');
    const pacFile = url.pathToFileURL(path.join('..', 'pointnetwork', 'client', 'proxy', 'pac.js'));
    const osAndArch = helpers.getOSAndArch();
    const filename = firefox.getFileName(osAndArch, version);
    const releasePath = path.join(browserDir, filename);
    const firefoxRelease = fs.createWriteStream(releasePath);
    const firefoxURL = firefox.getURL(version, osAndArch, language, filename);

    if (!fs.existsSync(browserDir)){
        fs.mkdirSync(browserDir);
    }

    const http_s = helpers.getHTTPorHTTPs(osAndArch, pacFile);

    await http_s.get(firefoxURL, async (response) => {
        await response.pipe(firefoxRelease);
        firefoxRelease.on('finish', () => {
            let cb = function() {
                win.webContents.send("firefox-installed");
                
                fs.unlink(releasePath, (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(`\nDeleted file: ${releasePath}`);
                    }
                });

                firefox.createConfigFiles(osAndArch);
            };
            firefox.unpack(osAndArch, releasePath, browserDir, cb);
        });
    });
});
