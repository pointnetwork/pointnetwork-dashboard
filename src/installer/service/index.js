import * as fsExtra from "fs-extra";
import * as fs from "fs";
import * as path from "path";
import helpers, {getOSAndArch} from "../../helpers";
import {exec} from "child_process";

class InstallerService {
    pointDir = '';
    pointSrcDir = '';

    constructor(win) {
        this.win = win;
        this.osAndArch = getOSAndArch();
    }

    start() {
        try {
            this._log('Starting out...');
            // todo: install git
            // todo: install wsl
            this.makePointDirectory();
            this.makePointSrcDirectory();
            this.cloneRepos();
            this.installDocker();

            this.done();
        } catch(e) {
            this.tryToShowError(e);
            // throw e;
        }
    }

    makePointDirectory() {
        this.pointDir = this._createHomePath('.point'); // todo: make sure it is writeable by us
    }

    makePointSrcDirectory() {
        this.pointSrcDir = this._createHomePath('.point', 'src'); // todo: make sure it is writeable by us
    }

    installDocker() {
        if (this._isDockerInstalled()) return;
        //todo ...
    }

    cloneRepos() {
        this._clonePointNetworkRepo('pointnetwork');
    }

    done() {
        this._log('Done.');
    }

    tryToShowError(e) {
        this.win.webContents.send("fatal", { e });
    }

    _log(text) {
        this.win.webContents.send("log", { text });
    }

    _clonePointNetworkRepo(repoName) {
        const dir = path.join(this.pointSrcDir, repoName);
        if (fs.existsSync(dir)) {
            this._exec('cd '+this._quote(dir)+'; git pull; cd -');
        } else {
            this._exec('git clone https://github.com/pointnetwork/'+repoName+' '+this._quote(dir));
        }
    }

    _quote(s) {
        // todo: better escaping for bash
        return '"' + s + '"'; // todo: make sure there are no " inside
    }

    _exec(cmd) {
        if (this.osAndArch === 'win32' || this.osAndArch === 'win64') { // todo: and not already starts with wsl
            cmd = `wsl ${cmd}`;
        }

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                // this.win.webContents.send("docker-checked", { ...args,
                //     status: 'not running'
                // });
                throw Error(error.message);
            }

            this._log(stdout);
            if (typeof stderr !== 'undefined' && stderr !== '') this.tryToShowError(stderr);
        });
    }

    _createHomePath(...paths) {
        const homedir = require('os').homedir();
        const dir = path.join(homedir, ...paths);
        if (! fs.existsSync(dir)) fsExtra.mkdirpSync(dir);
        return dir;
    }

    _isDockerInstalled() {
        const osAndArch = getOSAndArch();
        return true;// todo:
    }

    // async getHealthCmd(osAndArch, containerName) {
    //     const pnPath = await helpers.getPNPath(helpers.getOSAndArch());
    //     const composePath = helpers.fixPath(osAndArch, path.join(pnPath, 'docker-compose.yaml'));
    //     const composeDevPath = helpers.fixPath(osAndArch, path.join(pnPath, 'docker-compose.dev.yaml'));
    //
    //     const cmd = `docker inspect --format "{{json .State.Health}}" $(docker-compose -f ${composePath} -f ${composeDevPath} ps -q ${containerName})`;
    //     if (osAndArch == 'win32' || osAndArch == 'win64') {
    //         return `wsl ${cmd}`;
    //     }
    //     return cmd;
    // }


}

export default InstallerService;