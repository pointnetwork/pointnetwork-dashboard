import firefox from "../firefox";
import helpers from "../helpers";
import docker from "../docker";
import {exec} from "child_process";
import {arch, platform} from "process";
import path from "path";
import url from "url";
import fs from "fs-extra";
const { http } = require('follow-redirects');

export const attach = (ipcMain, win) => {
    ipcMain.on("point-node-check", async (event, args) => {
        http.get("http://localhost:2468/v1/api/status/ping", (res) => {
            win.webContents.send("point-node-checked", true);
        }).on('error', err => {
            win.webContents.send("point-node-checked", false);
        });
    });

    ipcMain.on("firefox-check", async (event, args) => {
        if (await firefox.isInstalled()) {
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

    ipcMain.on("firefox-run", async(event, args) => {
        await firefox.launch();
    });

    ipcMain.on("firefox-download", async (event, args) => {
        await firefox.download(win);
    });

    ipcMain.on("docker-download", async (event, args) => {
        await docker.download();
    });

    ipcMain.on("docker-check-installed", async (event, args) => {
        if (docker.isInstalled()) {
            win.webContents.send("docker-checked-installed", true);
            return;
        }
        win.webContents.send("docker-checkeded-installed", false);
    });


    ipcMain.on("docker-run", async(event, args) => {
            await docker.startCompose();
    });

    ipcMain.on("logout", async(event, args) => {
        await helpers.logout();
    });
}
