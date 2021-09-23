import firefox from "./firefox";
import helpers from "./helpers";
import docker from "./docker";
import {exec} from "child_process";
import {arch, platform} from "process";
import path from "path";
import url from "url";
import fs from "fs-extra";

export const attach = (ipcMain, win) => {
    ipcMain.on("firefox-check", async (event, args) => {
        if (firefox.isInstalled()) {
            win.webContents.send("firefox-checked", true);
            return;
        }
        win.webContents.send("firefox-checked", false);
    });

    // TODO: Rename to "docker-check-status", because we're having "docker-check-installed".
    // TODO: Send these ipc hooks to other files: firefox, docker, etc.
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

    ipcMain.on("docker-download", async (event, args) => {
        const language = args.language;
        const dockerDir = path.join('.', 'docker');
        const osAndArch = helpers.getOSAndArch();
        const filename = docker.getFileName(osAndArch, version);
        const releasePath = path.join(dockerDir, filename);
        const dockerRelease = fs.createWriteStream(releasePath);
        const dockerURL = docker.getURL(version, osAndArch, language, filename);

        if (!fs.existsSync(dockerDir)){
            fs.mkdirSync(dockerDir);
        }

        const http_s = helpers.getHTTPorHTTPs(osAndArch, pacFile);

        await http_s.get(dockerURL, async (response) => {
            await response.pipe(dockerRelease);
            dockerRelease.on('finish', () => {
                let cb = function() {
                    win.webContents.send("docker-installed");

                    fs.unlink(releasePath, (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(`\nDeleted file: ${releasePath}`);
                        }
                    });

                    docker.createConfigFiles(osAndArch);
                };
                docker.unpack(osAndArch, releasePath, dockerDir, cb);
            });
        });
    });

    ipcMain.on("docker-check-installed", async (event, args) => {
        if (docker.isInstalled()) {
            win.webContents.send("docker-checked-installed", true);
            return;
        }
        win.webContents.send("docker-checkeded-installed", false);
    });
}
