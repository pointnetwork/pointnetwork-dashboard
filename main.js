// Modules to control application life and create native browser window
const { app,
        BrowserWindow,
        ipcMain,
        Menu,
        Tray,
        nativeImage
      } = require('electron');
const path = require('path');
const { http, https } = require('follow-redirects');
const { platform, arch } = require('process');
const fs = require('fs');
const tarfs = require('tar-fs');
const bz2 = require('unbzip2-stream');
const { exec } = require('child_process');
const url = require('url');
const _7z = require('7zip-min');

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

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isDirEmpty(path) {
    return fs.readdirSync(path).length === 0;
}

function isFirefoxInstalled() {
    const browserDir = path.join('.', 'point-browser');

    if (!fs.existsSync(browserDir)) {
        fs.mkdirSync(browserDir);
    }

    if (!isDirEmpty(browserDir)) {
        return true;
    }
    return false;
}

ipcMain.on("firefox-check", async (event, args) => {
    if (isFirefoxInstalled()) {
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
    win.webContents.send("platform-checked", {os: platform, arch: arch});
});

ipcMain.on("firefox-run", (event, args) => {
    const cmd = getFirefoxBinPath(getOSAndArch());
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

function getOSAndArch() {
    let osAndArch = '';
    
    if (platform == 'darwin') {
        osAndArch = 'mac';
    }
    if (platform == 'linux') {
        if (arch == 'x64') {
            osAndArch = 'linux-x86_64';
        }
        if (arch == 'x32') {
            osAndArch = 'linux-i686';
        }
    }
    if (platform == 'win32') {
        if (arch == 'x64') {
            osAndArch = 'win64';
        }
        if (arch == 'x32') {
            osAndArch = 'win32';
        }
    }
    
    if (osAndArch == '') {
        throw 'Platform not supported.';
    }
    return osAndArch;
}

function getFirefoxURL(version, osAndArch, language, filename) {
    if (osAndArch == 'win32' || osAndArch == 'win64') {
        return 'https://github.com/pointnetwork/phyrox-esr-portable/releases/download/test/point-browser-portable-win64-78.12.0-55.7z';
    }
    // linux & mac
    return `http://download.cdn.mozilla.net/pub/mozilla.org/firefox/releases/${version}/${osAndArch}/${language}/${filename}`;
}

function getFirefoxFileName(osAndArch, version) {
    if (osAndArch == 'win32' || osAndArch == 'win64') {
        // TODO: Still unsure about this: we need to decide on the name
        // of the browser, check how we get the version, etc.
        return `point-browser-portable-${osAndArch}-78.12.0-55.7z`;
    }
    if (osAndArch == 'mac') {
        return `Firefox%20${version}.dmg`;
    }
    // linux & mac
    return `firefox-${version}.tar.bz2`;
}

function getHTTPorHTTPs(osAndArch) {
    if (osAndArch == 'win32' || osAndArch == 'win64') {
        return https;
    }
    return http;
}

function firefoxUnpack(osAndArch, releasePath, browserDir, cb) {
    if (osAndArch == 'win32' || osAndArch == 'win64') {
        _7z.unpack(releasePath, browserDir, (err) => { if (err) throw err; cb();});
    }
    if (osAndArch == 'mac') {
        // DMG. No extraction required.
        return;
    }
    if (osAndArch == 'linux-x86_64' || osAndArch == 'linux-i686') {
        let readStream = fs.createReadStream(releasePath).pipe(bz2()).pipe(tarfs.extract(browserDir));
        // readStream.on('finish', () => {cb();} );
        readStream.on('finish', cb );
    }
}

function getFirefoxRootPath(osAndArch) {
    if (osAndArch == 'win32' || osAndArch == 'win64' || osAndArch == 'mac') {
        return path.join('.', 'point-browser');
    }
    // linux
    return path.join('.', 'point-browser', 'firefox');
}

function getFirefoxAppPath(osAndArch) {
    const rootPath = getFirefoxRootPath(osAndArch);

    if (osAndArch == 'win32' || osAndArch == 'win64' || osAndArch == 'mac') {
        const appPath = path.join(rootPath, 'app');

        if (!fs.existsSync(appPath)) {
            fs.mkdirSync(appPath);
        }
        
        return appPath;
    }

    // linux
    return rootPath;
}

function getFirefoxPrefPath(osAndArch) {
    const rootPath = getFirefoxRootPath(osAndArch);
    
    if (osAndArch == 'win32' || osAndArch == 'win64' || osAndArch == 'mac') {
        const appPath = path.join(rootPath, 'app');
        const defaultsPath = path.join(appPath, 'defaults');
        const prefPath = path.join(defaultsPath, 'pref');

        if (!fs.existsSync(appPath)) {
            fs.mkdirSync(appPath);
        }
        if (!fs.existsSync(defaultsPath)) {
            fs.mkdirSync(defaultsPath);
        }
        if (!fs.existsSync(prefPath)) {
            fs.mkdirSync(prefPath);
        }
        
        return prefPath;
    }
    // linux. all directories already exist.
    return path.join(rootPath, 'defaults', 'pref');
}

function getFirefoxBinPath(osAndArch) {
    const rootPath = getFirefoxRootPath(osAndArch);
    if (osAndArch == 'win32' || osAndArch == 'win64' || osAndArch == 'mac') {
        return path.join(rootPath, 'point-browser-portable.exe');
    }
    // linux
    return path.join(rootPath, 'firefox', 'firefox');
}

function createFirefoxConfigFiles(osAndArch, pacFile) {
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
    const prefPath = getFirefoxPrefPath(osAndArch);
    const appPath = getFirefoxAppPath(osAndArch);
    
    if (osAndArch == 'win32' || osAndArch == 'win64') {
        // Portapps creates `defaults/pref/autonfig.js` for us, same contents.
        //
        // Portapps also creates `portapps.cfg`, which is equivalent to *nix's firefox.cfg.
        // We're just appending our preferences.
        fs.appendFile(path.join(appPath, 'portapps.cfg'),
                     firefoxCfgContent,
                     err => {
                         if (err) {
                             console.error(err);
                             return;
                         }
                     });
    }
    if (osAndArch == 'mac') {
        return;
    }
    if (osAndArch == 'linux-x86_64' || osAndArch == 'linux-i686') {
        fs.writeFile(path.join(prefPath, 'autoconfig.js'),
                     autoconfigContent,
                     err => {
                         if (err) {
                             console.error(err);
                             return;
                         }
                     });

        fs.writeFile(path.join(appPath, 'firefox.cfg'),
                     firefoxCfgContent,
                     err => {
                         if (err) {
                             console.error(err);
                             return;
                         }
                     });
    }
}

ipcMain.on("firefox-download", async (event, args) => {
    const language = args.language;
    const version = '92.0b7';
    const browserDir = path.join('.', 'point-browser');
    const pacFile = url.pathToFileURL(path.join('..', 'pointnetwork', 'client', 'proxy', 'pac.js'));
    const osAndArch = getOSAndArch();
    const filename = getFirefoxFileName(osAndArch, version);
    const releasePath = path.join(browserDir, filename);
    const firefoxRelease = fs.createWriteStream(releasePath);
    const firefoxURL = getFirefoxURL(version, osAndArch, language, filename);

    if (!fs.existsSync(browserDir)){
        fs.mkdirSync(browserDir);
    }

    const http_s = getHTTPorHTTPs(osAndArch, pacFile);

    const request = await http_s.get(firefoxURL, async (response) => {
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

                createFirefoxConfigFiles(osAndArch);
            };
            firefoxUnpack(osAndArch, releasePath, browserDir, cb);
        });
    });
});
