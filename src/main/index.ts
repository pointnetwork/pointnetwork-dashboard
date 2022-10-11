import installer, {Installer} from '../installer';
import dashboard from '../dashboard';
import welcome from '../welcome';
import helpers from '../../shared/helpers';
import Logger from '../../shared/logger';
import {app, dialog} from 'electron';
import fs from 'fs-extra';
import lockfile from 'proper-lockfile';
import {ErrorsEnum} from '../@types/errors';
import * as dotenv from 'dotenv';

const logger = new Logger({module: 'main'});

let release: () => Promise<void>;
app.on('will-quit', async function () {
    logger.info('"will-quit" event');
    if (release) {
        release()
            .then(() => {logger.info('Lockfile successfully released');})
            .catch(error => {
                logger.error({
                    errorType: ErrorsEnum.LOCKFILE_ERROR,
                    error
                });
            });
    }
});

export default async function main() {
    dotenv.config();

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
    release = await lockfile.lock(lockfilePath, {stale: 5000});

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
    .catch((error: Error) => {
        logger.error({
            errorType: ErrorsEnum.FATAL_ERROR,
            error
        });
        dialog.showErrorBox('Error', 'Point Dashboard is already running.');
    });
