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
    let welcomeService = new WelcomeService(win)

    ipcMain.on("quit", async (event, args) => {
        app.quit();
        process.exit();
    });
    ipcMain.on("start", async (event, args) => {
        setImmediate(() => {
            try {
                welcomeService.start();
            } catch(e) {
                welcomeService.tryToShowError(e);
                throw e;
            }
        });
    });
    ipcMain.on("login", async (event, args) => {
        setImmediate(async() => {
            try {
                const { phrase, firstTime } = args;
                await welcomeService.login(phrase, firstTime);
            } catch(e) {
                welcomeService.tryToShowError(e);
                throw e;
            }
        });
    });
    ipcMain.on("mainDecision", async (event, args) => {
        setImmediate(async() => {
            app.mainDecision();
        });
    });
}