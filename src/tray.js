// Tray stuff.
import path from "path";
import {app, Menu, nativeImage, Tray} from "electron";

export const init = () => {
    const iconPath = path.join(__dirname, 'resources/logo.ico');
    const tray = new Tray(nativeImage.createFromPath(iconPath));
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

    return tray;
};