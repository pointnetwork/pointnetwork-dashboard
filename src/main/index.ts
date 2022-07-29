import installer, {Installer} from '../installer';
import dashboard from '../dashboard';
import welcome from '../welcome';
import helpers from '../../shared/helpers';
import Logger from '../../shared/logger';
import {dialog} from 'electron';
import fs from 'fs-extra';
import lockfile from 'proper-lockfile';

const logger = new Logger({module: 'main'});

export default async function main() {
    logger.info('Checking for updates');
    require('update-electron-app')();
    logger.info('Launching Dashboard');

    const pointDir = helpers.getPointPath();
    if (!fs.existsSync(pointDir)) {
        await fs.mkdir(pointDir, {recursive: true});
    }

    // This is just a dummy file since proper-lockfile package needs some file to lock
    const lockfilePath = helpers.getPointLockfilePath();
    if (!fs.existsSync(lockfilePath)) {
        await fs.writeFile(lockfilePath, 'point');
    }
    // This will throw if another dashboard is running
    await lockfile.lock(lockfilePath, {stale: 5000});

    helpers.getPlatform();
    if (!(await Installer.isInstalled())) {
        installer();
    } else {
        if (!(helpers.isLoggedIn())) {
            welcome();
        } else {
            dashboard();
        }
    }
}

main()
    .catch(e => {
        logger.error(e);
        dialog.showErrorBox('Error', 'Point Dashboard is already running.');
    });
