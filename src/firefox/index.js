const fs = require('fs-extra');
const path = require('path');
const _7z = require('7zip-min');
const dmg = require('dmg');
const tarfs = require('tar-fs');
const bz2 = require('unbzip2-stream');

const helpers = require('../helpers');

module.exports = {
    isInstalled() {
        const browserDir = path.join('.', 'point-browser');

        if (!fs.existsSync(browserDir)) {
            fs.mkdirSync(browserDir);
        }

        if (!helpers.isDirEmpty(browserDir)) {
            return true;
        }
        return false;
    },

    getURL(version, osAndArch, language, filename) {
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            return 'https://github.com/pointnetwork/phyrox-esr-portable/releases/download/test/point-browser-portable-win64-78.12.0-55.7z';
        }
        // linux & mac
        return `http://download.cdn.mozilla.net/pub/mozilla.org/firefox/releases/${version}/${osAndArch}/${language}/${filename}`;
    },
    
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
    },

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
    },

    getRootPath(osAndArch) {
        if (osAndArch == 'win32' || osAndArch == 'win64' || osAndArch == 'mac') {
            return path.join('.', 'point-browser');
        }
        // linux
        return path.join('.', 'point-browser', 'firefox');
    },

    getAppPath(osAndArch) {
        const rootPath = this.getRootPath(osAndArch);

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
    },

    getPrefPath(osAndArch) {
        const rootPath = this.getRootPath(osAndArch);
        
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
    },

    getBinPath(osAndArch) {
        const rootPath = this.getRootPath(osAndArch);
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            return path.join(rootPath, 'point-browser-portable.exe');
        }
        if (osAndArch == 'mac') {
            return `open ${path.join(rootPath, 'Firefox.app')}`;
        }
        // linux
        return path.join(rootPath, 'firefox');
    },

    createConfigFiles(osAndArch, pacFile) {
        const autoconfigContent = `pref("general.config.filename", "firefox.cfg");
pref("general.config.obscure_value", 0);
`;
        const firefoxCfgContent = `
// IMPORTANT: Start your code on the 2nd line
// pref('network.proxy.type', 1);
pref('network.proxy.type', 2);
pref('network.proxy.http', 'localhost');
pref('network.proxy.http_port', 65500);
pref('browser.startup.homepage', 'about:blank');
pref('network.proxy.allow_hijacking_localhost', true);
pref('browser.fixup.domainsuffixwhitelist.z', true);
pref('browser.fixup.domainsuffixwhitelist.point', true);
pref('network.proxy.autoconfig_url', '${pacFile}');
`;
        const prefPath = this.getPrefPath(osAndArch);
        const appPath = this.getAppPath(osAndArch);
        
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
};
