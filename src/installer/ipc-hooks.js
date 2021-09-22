const InstallerService = require('./service').default;

export const attach = (ipcMain, win, app) => {
    ipcMain.on("quit", async (event, args) => {
        app.quit();
        process.exit();
    });
    ipcMain.on("start", async (event, args) => {
        const installerService = new InstallerService(win);
        try {
            setImmediate(() => {
                installerService.start();
            });
        } catch(e) {
            installerService.tryToShowError(e);
            throw e;
        }
    });
}