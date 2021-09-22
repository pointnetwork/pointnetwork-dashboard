// import firefox from "./firefox";
// import helpers from "./helpers";
// import docker from "./docker";
// import {exec} from "child_process";
// import {arch, platform} from "process";
// import path from "path";
// import url from "url";
// import fs from "fs-extra";
const WelcomeService = require('./service').default;

export const attach = (ipcMain, win, app) => {
    ipcMain.on("quit", async (event, args) => {
        app.quit();
        process.exit();
    });
    ipcMain.on("start", async (event, args) => {
        const welcomeService = new WelcomeService(win);
        try {
            setImmediate(() => {
                welcomeService.start();
            });
        } catch(e) {
            welcomeService.tryToShowError(e);
            throw e;
        }
    });
    // ipcMain.on("quit", async (event, args) => {
    //     if (firefox.isInstalled()) {
    //         win.webContents.send("firefox-checked", true);
    //         return;
    //     }
    //     win.webContents.send("firefox-checked", false);
    // });
    //
    // ipcMain.on("docker-check", async (event, args) => {
    //     const containerName = args.container;
    //     const osAndArch = helpers.getOSAndArch();
    //     const cmd = await docker.getHealthCmd(osAndArch, containerName);
    //
    //     exec(cmd, (error, stdout, stderr) => {
    //         if (error) {
    //             console.log(`error: ${error.message}`);
    //             win.webContents.send("docker-checked", {...args, status: 'not running'});
    //             return;
    //         }
    //
    //         const resp = JSON.parse(stdout);
    //         const status = resp != null ? resp.Status : 'no connection';
    //         win.webContents.send("docker-checked", {status: status, ...args});
    //     });
    // });
    //
    // ipcMain.on("docker-logs", async (event, args) => {
    //     const containerName = args.container;
    //     const cmd = `x-terminal-emulator -e docker-compose -f ${compose} -f ${composeDev} logs -f ${containerName} && bash || bash`;
    //     exec(cmd, (error, stdout, stderr) => {
    //         if (error) {
    //             console.log(`error: ${error.message}`);
    //             return;
    //         }
    //         if (stderr) {
    //             console.log(`stderr: ${stderr}`);
    //             return;
    //         }
    //     });
    // });
    //
    // ipcMain.on("platform-check", async (event, args) => {
    //     win.webContents.send("platform-checked", {os: platform, arch: arch});
    // });
    //
    // ipcMain.on("firefox-run", (event, args) => {
    //     const cmd = firefox.getBinPath(helpers.getOSAndArch());
    //     exec(cmd, (error, stdout, stderr) => {
    //         win.webContents.send("firefox-closed");
    //         if (error) {
    //             console.log(`error: ${error.message}`);
    //             return;
    //         }
    //         if (stderr) {
    //             console.log(`stderr: ${stderr}`);
    //             return;
    //         }
    //         console.log(`stdout: ${stdout}`);
    //     });
    // });
    //
    // ipcMain.on("firefox-download", async (event, args) => {
    //     const language = args.language;
    //     const version = '93.0b4';
    //     const browserDir = path.join('.', 'point-browser');
    //     const pacFile = url.pathToFileURL(path.join('..', 'pointnetwork', 'client', 'proxy', 'pac.js'));
    //     const osAndArch = helpers.getOSAndArch();
    //     const filename = firefox.getFileName(osAndArch, version);
    //     const releasePath = path.join(browserDir, filename);
    //     const firefoxRelease = fs.createWriteStream(releasePath);
    //     const firefoxURL = firefox.getURL(version, osAndArch, language, filename);
    //
    //     if (!fs.existsSync(browserDir)){
    //         fs.mkdirSync(browserDir);
    //     }
    //
    //     const http_s = helpers.getHTTPorHTTPs(osAndArch, pacFile);
    //
    //     await http_s.get(firefoxURL, async (response) => {
    //         await response.pipe(firefoxRelease);
    //         firefoxRelease.on('finish', () => {
    //             let cb = function() {
    //                 win.webContents.send("firefox-installed");
    //
    //                 fs.unlink(releasePath, (err) => {
    //                     if (err) {
    //                         console.log(err);
    //                     } else {
    //                         console.log(`\nDeleted file: ${releasePath}`);
    //                     }
    //                 });
    //
    //                 firefox.createConfigFiles(osAndArch);
    //             };
    //             firefox.unpack(osAndArch, releasePath, browserDir, cb);
    //         });
    //     });
    // });
}