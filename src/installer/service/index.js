import * as fsExtra from "fs-extra";
import * as fs from "fs";
import * as path from "path";
import helpers, {getOSAndArch} from "../../helpers";
import docker from "../../docker";
const util = require('util');
const exec = util.promisify(require('child_process').exec);
import * as axios from "axios";
const sudo = require('sudo-prompt');

class InstallerService {
    pointDir = '';
    pointSrcDir = '';

    constructor(win) {
        this.win = win;
        this.osAndArch = getOSAndArch();
        this.steps = {
            // todo: install git
            // todo: install wsl
            'Create ~/.point directory': this.makePointDirectory,
            'Create ~/.point/src directory': this.makePointSrcDirectory,
            'Clone PointNetwork repositories': this.cloneRepos,
            'Install Docker': this.installDocker,
        };
    }
    
    async start() {
        try {
            this._log('Starting out...', {type: 'step'});

            for(let [k,v] of Object.entries(this.steps)) {
                this._log('➡️ ' + k, {type: 'step'});
                const testRun = await (v.bind(this))(true);
                if (testRun) {
                    this._log('✅ Already done');
                } else {
                    await (v.bind(this))(false);
                    this._log('✅ Done');
                }
                // await this._exec('sleep 5');
            }

            this.done();
        } catch(e) {
            this.tryToShowError(e);
            // throw e;
        }
    }

    async makePointDirectory(testRun = false) {
        this.pointDir = await this._getHomeSubPath('.point');
        if (testRun) return fs.existsSync(this.pointDir);
        fsExtra.mkdirpSync(this.pointDir);
    }

    async makePointSrcDirectory(testRun = false) {
        this.pointSrcDir = await this._getHomeSubPath('.point', 'src');
        if (testRun) return fs.existsSync(this.pointSrcDir);
        fsExtra.mkdirpSync(this.pointSrcDir);
    }

    async installDocker(testRun = false) {
        if (testRun) {
            return false;
            try {
                await this._execAndGetOutput('which docker');
                return true;
            } catch(e) {
                return false;
            }
        }

        if (this.isWindows64()) {
            const url = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe";

        }

        const response = await axios.get('https://github.com/docker/compose/releases/latest', {
            headers: { accept: 'application/json' },
            data: {}
        });
        /**
         *     data: {
                  id: 42700380,
                  tag_name: '1.29.2',
                  update_url: '/docker/compose/releases/tag/1.29.2',
                  update_authenticity_token: 'Z0iLO6fLimW0WB3tuZhyBg1j82eJg+6mYCtBAwY7mFs4Wv4BRsgSByzSMj4yBzk3a/6Vzicvrzh1AefJAiGEFQ==',
                  delete_url: '/docker/compose/releases/tag/1.29.2',
                  delete_authenticity_token: 'SQoTXN7DrXP2oZIMXQgpJ3ilrg2OvRJZPv4a60wXcjuAk98ceaZ44IFEKvaY6JYHy73Ty8wQCmk2cWwAjVGGfA==',
                  edit_url: '/docker/compose/releases/edit/1.29.2'
                }
         */
        const latest_tag = response.data.tag_name;
        this._log('Latest docker/compose release: '+latest_tag); // todo: escape

        sudo.exec('curl -L '+this._quote("https://github.com/docker/compose/releases/download/"+latest_tag+"/docker-compose-$(uname -s)-$(uname -m)")+' -o /usr/local/bin/docker-compose');
    }

    async cloneRepos(testRun = false) {
        await this._clonePointNetworkRepo(testRun, 'pointnetwork');
    }

    done() {
        this._log('👌 Done.');
    }

    tryToShowError(e) {
        this._log(e.message, { type: 'error' });
    }

    isWindows64() {
        return (this.osAndArch === 'win64');
    }

    _log(text, opts) {
        this.win.webContents.send("log", { text, opts });
    }

    async _clonePointNetworkRepo(testRun, repoName) {
        if (testRun) return false;
        const dir = path.join(this.pointSrcDir, repoName);
        if (fs.existsSync(dir)) {
            await this._exec('cd '+this._quote(dir)+'; git pull; cd -');
        } else {
            await this._exec('git clone https://github.com/pointnetwork/'+repoName+' '+this._quote(dir));
        }
    }

    _quote(s) {
        // todo: better escaping for bash
        return '"' + s + '"'; // todo: make sure there are no " inside
    }

    async _exec(cmd) {
        if (this.osAndArch === 'win32' || this.osAndArch === 'win64') { // todo: and not already starts with wsl
            cmd = `wsl ${cmd}`;
        }

        this._log(''); // empty line
        this._log('> '+cmd, { type: 'cmd' });

        const promise = exec(cmd);
        const child = promise.child;
        child.stdout.on('data', (data) => {
            this._log(data);
        });
        child.stderr.on('data', (data) => {
            if (typeof data !== 'undefined' && data !== '') this.tryToShowError(data);
        });
        child.on('close', (code) => {
            if (code === 0) {
                // Everything is well.
            } else {
                this.tryToShowError('Command finished with code '+code);
            }
        });

        const { stdout, stderr } = await promise;
    }

    async _execAndGetOutput(cmd) {
        if (this.osAndArch === 'win32' || this.osAndArch === 'win64') { // todo: and not already starts with wsl
            cmd = `wsl ${cmd}`;
        }

        let out = '';
        let err = '';

        const promise = exec(cmd);
        const child = promise.child;
        child.stdout.on('data', (data) => {
            out += data;
        });
        child.stderr.on('data', (data) => {
            if (typeof data !== 'undefined' && data !== '') err += data;
        });
        child.on('close', (code) => {
            if (code === 0 && err === '') {
                // Everything is well.
                return out;
            } else {
                throw err;
            }
        });

        const { stdout, stderr } = await promise;
    }

    async _getHomeSubPath(...paths) {
        const homedir = await helpers.getHomePath();
        return path.join(homedir, ...paths);
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
