const fs = require('fs-extra');
const path = require('path');
const _7z = require('7zip-min');
const dmg = require('dmg');
const tarfs = require('tar-fs');
const bz2 = require('unbzip2-stream');
const url = require('url');

const helpers = require('../helpers');
const {exec} = require("child_process");
const { https } = require('follow-redirects');

class Firefox {
    async getFolderPath(osAndArch) {
        return await helpers.getBrowserFolderPath(osAndArch);
    };

    async isInstalled() {
        const browserDir = await this.getFolderPath(helpers.getOSAndArch());

        if (!fs.existsSync(browserDir)) {
            fs.mkdirpSync(browserDir);
        }

        if (!helpers.isDirEmpty(browserDir)) {
            return true;
        }
        return false;
    };

    getURL(version, osAndArch, language, filename) {
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            return 'https://github.com/pointnetwork/phyrox-esr-portable/releases/download/test/point-browser-portable-win64-78.12.0-55.7z';
        }
        // linux & mac
        return `https://download.cdn.mozilla.net/pub/mozilla.org/firefox/releases/${version}/${osAndArch}/${language}/${filename}`;
    };

    getFileName(osAndArch, version) {
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            // TODO: Still unsure about this: we need to decide on the name
            // of the browser, check how we get the version, etc.
            return `point-browser-portable-${osAndArch}-78.12.0-55.7z`;
        }
        if (osAndArch == 'mac') {
            return `Firefox%20${version}.dmg`;
        }
        // linux & mac
        return `firefox-${version}.tar.bz2`;
    };

    async download() {
        const language = 'en-US';
        const version = '93.0b4';
        const osAndArch = helpers.getOSAndArch();
        const browserDir = await this.getFolderPath(osAndArch);
        const pacFile = url.pathToFileURL(path.join(await helpers.getPNPath(osAndArch), 'client', 'proxy', 'pac.js'));
        const filename = this.getFileName(osAndArch, version);
        const releasePath = path.join(browserDir, filename);
        const firefoxRelease = fs.createWriteStream(releasePath);
        const firefoxURL = this.getURL(version, osAndArch, language, filename);

        if (!fs.existsSync(browserDir)){
            fs.mkdirSync(browserDir);
        }

        return await https.get(firefoxURL, async (response) => {
            await response.pipe(firefoxRelease);

            return await new Promise(async(resolve, reject) => {
                firefoxRelease.on('finish', () => {
                    let cb = async() => {
                        fs.unlink(releasePath, (err) => {
                            if (err) {
                                return reject(err);
                            } else {
                                console.log(`\nDeleted file: ${releasePath}`);
                            }
                        });

                        await this.createConfigFiles(osAndArch, pacFile);

                        return resolve(true);
                    };
                    this.unpack(osAndArch, releasePath, browserDir, cb);
                });
            })
        });
    }

    async launch() {
        const cmd = await this.getBinPath(helpers.getOSAndArch());
        const profile_path = "$HOME/.point/keystore/profile";
        const flags = "--profile "+profile_path;
        const webext_binary = "$HOME/.point/src/pointnetwork-dashboard/node_modules/web-ext/bin/web-ext";
        const ext_path = "$HOME/.point/src/pointsdk/dist/prod"; // should contain manifest.json
        const webext = `${webext_binary} run --firefox="${cmd}" --firefox-profile ${profile_path} --keep-profile-changes --source-dir ${ext_path} --url https://point`;

        exec(webext, (error, stdout, stderr) => {
            // win.webContents.send("firefox-closed");
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
        });
    }
    
    unpack(osAndArch, releasePath, browserDir, cb) {
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            _7z.unpack(releasePath, browserDir, (err) => { if (err) throw err; cb();});
        }
        if (osAndArch == 'mac') {
            dmg.mount(releasePath, (err, dmgPath) => {
                fs.copy(`${dmgPath}/Firefox.app`, `${browserDir}/Firefox.app`, (err) => {
                    if (err) {
                        console.log("Error Found:", err);
                        dmg.unmount(dmgPath, (err) => { if (err) throw err;});
                        return;
                    }
                    dmg.unmount(dmgPath, (err) => { if (err) throw err; cb();});
                });
            });
            return;
        }
        if (osAndArch == 'linux-x86_64' || osAndArch == 'linux-i686') {
            let readStream = fs.createReadStream(releasePath).pipe(bz2()).pipe(tarfs.extract(browserDir));
            // readStream.on('finish', () => {cb();} );
            readStream.on('finish', cb );
        }
    };

    async getRootPath(osAndArch) {
        if (osAndArch == 'win32' || osAndArch == 'win64' || osAndArch == 'mac') {
            return path.join(await this.getFolderPath(osAndArch));
        }
        // linux
        return path.join(await this.getFolderPath(osAndArch), 'firefox');
    };

    async getAppPath(osAndArch) {
        const rootPath = await this.getRootPath(osAndArch);

        if (osAndArch == 'win32' || osAndArch == 'win64' || osAndArch == 'mac') {
            let appPath = '';
            if (osAndArch == 'mac') {
                appPath = path.join(rootPath, 'Firefox.app', 'Contents', 'Resources');
            } else {
                appPath = path.join(rootPath, 'app');
            }

            if (!fs.existsSync(appPath)) {
                fs.mkdirSync(appPath);
            }

            return appPath;
        }

        // linux
        return rootPath;
    };

    async getPrefPath(osAndArch) {
        const rootPath = await this.getRootPath(osAndArch);

        if (osAndArch == 'win32' || osAndArch == 'win64' || osAndArch == 'mac') {
            let appPath = '';
            if (osAndArch == 'mac') {
                appPath = path.join(rootPath, 'Firefox.app', 'Contents', 'Resources');
            } else {
                appPath = path.join(rootPath, 'app');
            }

            const defaultsPath = path.join(appPath, 'defaults');
            const prefPath = path.join(defaultsPath, 'pref');

            if (!fs.existsSync(appPath)) {
                fs.mkdirSync(appPath);
            }
            if (!fs.existsSync(defaultsPath)) {
                fs.mkdirSync(defaultsPath);
            }
            if (!fs.existsSync(prefPath)) {
                fs.mkdirSync(prefPath);
            }

            return prefPath;
        }
        // linux. all directories already exist.
        return path.join(rootPath, 'defaults', 'pref');
    };

    async getBinPath(osAndArch) {
        const rootPath = await this.getRootPath(osAndArch);
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            return path.join(rootPath, 'point-browser-portable.exe');
        }
        if (osAndArch == 'mac') {
            return `${path.join(rootPath, 'Firefox.app')}`;
        }
        // linux
        return path.join(rootPath, 'firefox');
    };

    async createConfigFiles(osAndArch, pacFile) {
        if (!pacFile) throw Error('pacFile sent to createConfigFiles is undefined or null!');

        const autoconfigContent = `pref("general.config.filename", "firefox.cfg");
pref("general.config.obscure_value", 0);
`;
        const firefoxCfgContent = `
// IMPORTANT: Start your code on the 2nd line
// pref('network.proxy.type', 1);
pref('network.proxy.type', 2);
pref('network.proxy.http', 'localhost');
pref('network.proxy.http_port', 8666);
pref('browser.startup.homepage', 'https://point');
pref('startup.homepage_welcome_url', 'https://point/welcome');
pref('startup.homepage_welcome_url.additional', '');
pref('startup.homepage_override_url', '');
pref('network.proxy.allow_hijacking_localhost', true);
pref('browser.fixup.domainsuffixwhitelist.z', true);
pref('browser.fixup.domainsuffixwhitelist.point', true);
pref('browser.shell.checkDefaultBrowser', false);
pref('app.normandy.first_run', false);
pref('browser.laterrun.enabled', true);
pref('doh-rollout.doneFirstRun', true);
pref('trailhead.firstrun.didSeeAboutWelcome', true);
pref('toolkit.telemetry.reportingpolicy.firstRun', false);
pref('browser.shell.didSkipDefaultBrowserCheckOnFirstRun', true);
pref('app.shield.optoutstudies.enabled', false);
pref('network.proxy.autoconfig_url', '${pacFile}');
pref('security.enterprise_roots.enabled', true);
pref('network.captive-portal-service.enabled', false);
pref('browser.tabs.drawInTitlebar', true);
`;
        const prefPath = await this.getPrefPath(osAndArch);
        const appPath = await this.getAppPath(osAndArch);

        if (osAndArch == 'win32' || osAndArch == 'win64') {
            // Portapps creates `defaults/pref/autonfig.js` for us, same contents.
            //
            // Portapps also creates `portapps.cfg`, which is equivalent to *nix's firefox.cfg.
            // We're just appending our preferences.
            fs.appendFile(path.join(appPath, 'portapps.cfg'),
                firefoxCfgContent,
                err => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });
        }
        if (osAndArch == 'linux-x86_64' || osAndArch == 'linux-i686' || osAndArch == 'mac') {
            fs.writeFile(path.join(prefPath, 'autoconfig.js'),
                autoconfigContent,
                err => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });

            fs.writeFile(path.join(appPath, 'firefox.cfg'),
                firefoxCfgContent,
                err => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });
        }
    }
}

var fx = new Firefox();

module.exports = fx;
