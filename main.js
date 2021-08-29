// Modules to control application life and create native browser window
const { app,
        BrowserWindow,
        ipcMain,
        Menu,
        Tray,
        nativeImage
      } = require('electron');
const path = require('path');
const http = require('http');
const { platform } = require('process');
const fs = require('fs');
const tarfs = require('tar-fs');
const bz2 = require('unbzip2-stream');
const { exec } = require('child_process');
const url = require('url');

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
        { label: 'Item1', type: 'radio' },
        { label: 'Item2', type: 'radio' },
        { label: 'Item3', type: 'radio', checked: true },
        { label: 'Item4', type: 'radio' }
    ]);
    tray.setToolTip('This is my application.');
    tray.setContextMenu(contextMenu);
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

app.on('firefox-download', (event, arg) => {
    // Displays the object sent from the renderer process:
    //{
    //    message: "Hi",
    //    someData: "Let's go"
    //}
    console.log(
        arg
    );
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isDirEmpty(path) {
    return fs.readdirSync(path).length === 0;
}

ipcMain.on("firefox-check", async (event, args) => {
    // await sleep(1000);
    if (!isDirEmpty('./point-browser')) {
        win.webContents.send("firefox-checked", true);
        return;
    }
    win.webContents.send("firefox-checked", false);
});

// TODO: We need a better way of doing this. We're assuming paths.
const projectDir = path.join(__dirname, '..', 'pointnetwork');
const compose = path.join(projectDir, 'docker-compose.yaml');
const composeDev = path.join(projectDir, 'docker-compose.dev.yaml');

ipcMain.on("docker-check", async (event, args) => {
    // await sleep(1000);
    const containerName = args.container;
    // const cmd = `docker inspect --format='{{json .State.Health}}' ${containerName}`;
    const cmd = `docker inspect --format "{{json .State.Health}}" $(docker-compose -f ${compose} -f ${composeDev} ps -q ${containerName})`;
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            win.webContents.send("docker-checked", {...args, status: 'not running'});
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            win.webContents.send("docker-checked", {...args, status: 'no connection'});
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
    win.webContents.send("platform-checked", platform);
});

ipcMain.on("firefox-run", (event, args) => {
    exec("point-browser/firefox/firefox", (error, stdout, stderr) => {
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
    const version = '92.0b7';
    const filename = `firefox-${version}.tar.bz2`;
    const browserDir = path.join('.', 'point-browser');
    const releasePath = `${browserDir}/${filename}`;
    const pacFile = url.pathToFileURL(path.join('..', 'pointnetwork', 'client', 'proxy', 'pac.js'));
    const firefoxRelease = fs.createWriteStream(releasePath);
    const firefoxURL = `http://download.cdn.mozilla.net/pub/mozilla.org/firefox/releases/${version}/linux-x86_64/${language}/${filename}`;
    // const url = `https://download.mozilla.org/?product=firefox-latest&os=win&lang=${language}`;
    // const request = await http.get("http://i3.ytimg.com/vi/J---aiyznGQ/mqdefault.jpg", async (response) => {
    //     await response.pipe(file);
    // });

    const autoconfigContent = `pref("general.config.filename", "firefox.cfg");
pref("general.config.obscure_value", 0);
`;

    const firefoxCfgContent = `
// IMPORTANT: Start your code on the 2nd line
// pref('network.proxy.type', 1);
pref('network.proxy.type', 2);
pref('network.proxy.http', 'localhost');
pref('network.proxy.http_port', 65500);
pref('browser.startup.homepage', 'about:blank');
pref('network.proxy.allow_hijacking_localhost', true);
pref('browser.fixup.domainsuffixwhitelist.z', true);
pref('browser.fixup.domainsuffixwhitelist.point', true);
pref('network.proxy.autoconfig_url', '${pacFile}');
`;

    const request = await http.get(firefoxURL, async (response) => {
        await response.pipe(firefoxRelease);
        firefoxRelease.on('finish', () => {
            let readStream = fs.createReadStream(releasePath).pipe(bz2()).pipe(tarfs.extract(browserDir));
            readStream.on('finish', () => {
                win.webContents.send("firefox-installed");
                
                fs.unlink(releasePath, (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(`\nDeleted file: ${releasePath}`);
                    }
                });

                fs.mkdir(path.join(browserDir, 'firefox', 'defaults', 'pref'),
                         { recursive: true },
                         (err) => {
                             if (err) throw err;
                             fs.writeFile(path.join(browserDir, 'firefox', 'defaults', 'pref', 'autoconfig.js'),
                                          autoconfigContent,
                                          err => {
                                              if (err) {
                                                  console.error(err);
                                                  return;
                                              }
                                          });
                         });

                fs.writeFile(path.join(browserDir, 'firefox', 'firefox.cfg'),
                             firefoxCfgContent,
                             err => {
                                 if (err) {
                                     console.error(err);
                                     return;
                                 }
                             });
            });            
        });
    });


    // await fs.createReadStream(browserDir).pipe(bz2()).pipe(tarfs.extract('data'));
    // await fs.unlink(releasePath);
    
    // fs.readFile("path/to/file", (error, data) => {
    //     // Do something with file contents

    //     // Send result back to renderer process
    //     win.webContents.send("fromMain", responseObj);
    // });
});
