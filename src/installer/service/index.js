import * as fsExtra from "fs-extra";
import * as fs from "fs";
import * as path from "path";
import helpers, {getOSAndArch} from "../../helpers";
import pointnode from "../../pointnode";
import Welcome from "../../welcome";
import Dashboard from "../../dashboard";
const util = require('util');
const exec = util.promisify(require('child_process').exec);
import * as axios from "axios";
const sudo = require('sudo-prompt');
const os = require('os');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const which = require('which');

class InstallerService {
    pointDir = '';
    pointSrcDir = '';

    constructor(win, app) {
        this.win = win;
        this.app = app;
        this.osAndArch = getOSAndArch();
        
        this.steps = {};
        // if (this.isWindows()) {
        //     this.steps = {
        //         'Install WSL': this.installWSL,
        //     };
        // }
        
        Object.assign(this.steps, {
            'Create ~/.point directory': this.makePointDirectory,
            'Create ~/.point/src directory': this.makePointSrcDirectory,
            'Clone PointNetwork repositories': this.cloneRepos
        });
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

            await this.done();
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

    async installWSL(testRun = false) {
        if (testRun) {
            const testMsg = 'Hello';

            let wslTest = '';
	    try {
                wslTest = await this._execAndGetOutput(`echo ${testMsg}`);
	    } catch (e) {
	        
	    }
            
            // Checking both that wsl binary is present and that it has access to the virtual machine.
            if (which.sync('wsl', {nothrow: true}) != null && wslTest.indexOf(testMsg) >= 0) {
                return true;
            }
            return false;
        }
        sudo.exec('wsl --install');
    }

    async cloneRepos(testRun = false) {
        await this._clonePointNetworkRepo(testRun, 'pointnetwork');
    }

    async done() {
        this._log('👌 Done.');
        await helpers.setInstallationDone();

        setImmediate(() => {
            this.app.mainDecision();
        });
    }

    tryToShowError(e) {
        this._log(e.message, { type: 'error' });
    }

    isWindows64() {
        return (this.osAndArch === 'win64');
    }

    isWindows32() {
        return (this.osAndArch === 'win32');
    }

    isWindows() {
        return this.isWindows64() || this.isWindows32();
    }

    isWindows10Pro() {
        return this.isWindows() && os.release().indexOf("Pro");
    }

    _log(text, opts) {
        this.win.webContents.send("log", { text, opts });
    }

    async _clonePointNetworkRepo(testRun, repoName) {
        if (testRun) return false;
        const dir = path.join(this.pointSrcDir, repoName);
        if (fs.existsSync(dir)) {
            await git.pull({fs, http, dir, author: {name: 'PointNetwork', email: 'pn@pointnetwork.io'}});
        } else {
            await git.clone({fs, http, dir, url: `https://github.com/pointnetwork/${repoName}`});
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
            // I'm removing `&& err === ''`, because wsl sometimes throw errors related to your screen size not being appropriate for WSL.
            // This is the error: `your 131072x1 screen size is bogus. expect trouble`.
            // It shouldn't be a huge problem because we're still expecting the code to tell use everything went okay.
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
            if (code === 0) {
                // Everything is well.
                return out;
            } else {
                this.tryToShowError('Command finished with code '+code);
                // throw err;
            }
        });

        const { stdout, stderr } = await promise;

        return stdout;
    }

    async _getHomeSubPath(...paths) {
        const homedir = await helpers.getHomePath();
        return path.join(homedir, ...paths);
    }
}

export default InstallerService;
