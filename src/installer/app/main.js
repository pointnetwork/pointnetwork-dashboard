/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/docker/index.js":
/*!*****************************!*\
  !*** ./src/docker/index.js ***!
  \*****************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const helpers = __webpack_require__(/*! ../helpers */ "./src/helpers/index.js");

const path = __webpack_require__(/*! path */ "path");

module.exports = {
  async getHealthCmd(osAndArch, containerName) {
    const pnPath = await helpers.getPNPath(helpers.getOSAndArch());
    const composePath = helpers.fixPath(osAndArch, path.join(pnPath, 'docker-compose.yaml'));
    const composeDevPath = helpers.fixPath(osAndArch, path.join(pnPath, 'docker-compose.dev.yaml'));
    const cmd = `docker inspect --format "{{json .State.Health}}" $(docker-compose -f ${composePath} -f ${composeDevPath} ps -q ${containerName})`;

    if (osAndArch == 'win32' || osAndArch == 'win64') {
      return `wsl ${cmd}`;
    }

    return cmd;
  }

};

/***/ }),

/***/ "./src/firefox/index.js":
/*!******************************!*\
  !*** ./src/firefox/index.js ***!
  \******************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const fs = __webpack_require__(/*! fs-extra */ "fs-extra");

const path = __webpack_require__(/*! path */ "path");

const _7z = __webpack_require__(/*! 7zip-min */ "7zip-min");

const dmg = __webpack_require__(/*! dmg */ "dmg");

const tarfs = __webpack_require__(/*! tar-fs */ "tar-fs");

const bz2 = __webpack_require__(/*! unbzip2-stream */ "unbzip2-stream");

const helpers = __webpack_require__(/*! ../helpers */ "./src/helpers/index.js");

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
    } // linux & mac


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
    } // linux & mac


    return `firefox-${version}.tar.bz2`;
  },

  unpack(osAndArch, releasePath, browserDir, cb) {
    if (osAndArch == 'win32' || osAndArch == 'win64') {
      _7z.unpack(releasePath, browserDir, err => {
        if (err) throw err;
        cb();
      });
    }

    if (osAndArch == 'mac') {
      dmg.mount(releasePath, (err, dmgPath) => {
        fs.copy(`${dmgPath}/Firefox.app`, `${browserDir}/Firefox.app`, err => {
          if (err) {
            console.log("Error Found:", err);
            dmg.unmount(dmgPath, err => {
              if (err) throw err;
            });
            return;
          }

          dmg.unmount(dmgPath, err => {
            if (err) throw err;
            cb();
          });
        });
      });
      return;
    }

    if (osAndArch == 'linux-x86_64' || osAndArch == 'linux-i686') {
      let readStream = fs.createReadStream(releasePath).pipe(bz2()).pipe(tarfs.extract(browserDir)); // readStream.on('finish', () => {cb();} );

      readStream.on('finish', cb);
    }
  },

  getRootPath(osAndArch) {
    if (osAndArch == 'win32' || osAndArch == 'win64' || osAndArch == 'mac') {
      return path.join('.', 'point-browser');
    } // linux


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
    } // linux


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
    } // linux. all directories already exist.


    return path.join(rootPath, 'defaults', 'pref');
  },

  getBinPath(osAndArch) {
    const rootPath = this.getRootPath(osAndArch);

    if (osAndArch == 'win32' || osAndArch == 'win64') {
      return path.join(rootPath, 'point-browser-portable.exe');
    }

    if (osAndArch == 'mac') {
      return `open ${path.join(rootPath, 'Firefox.app')}`;
    } // linux


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
      fs.appendFile(path.join(appPath, 'portapps.cfg'), firefoxCfgContent, err => {
        if (err) {
          console.error(err);
          return;
        }
      });
    }

    if (osAndArch == 'linux-x86_64' || osAndArch == 'linux-i686' || osAndArch == 'mac') {
      fs.writeFile(path.join(prefPath, 'autoconfig.js'), autoconfigContent, err => {
        if (err) {
          console.error(err);
          return;
        }
      });
      fs.writeFile(path.join(appPath, 'firefox.cfg'), firefoxCfgContent, err => {
        if (err) {
          console.error(err);
          return;
        }
      });
    }
  }

};

/***/ }),

/***/ "./src/helpers/index.js":
/*!******************************!*\
  !*** ./src/helpers/index.js ***!
  \******************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {
  http,
  https
} = __webpack_require__(/*! follow-redirects */ "follow-redirects");

const path = __webpack_require__(/*! path */ "path");

const fs = __webpack_require__(/*! fs-extra */ "fs-extra");

const os = __webpack_require__(/*! os */ "os");

const {
  exec
} = __webpack_require__(/*! child_process */ "child_process");

const util = __webpack_require__(/*! util */ "util");

const {
  platform,
  arch
} = __webpack_require__(/*! process */ "process");

const execProm = util.promisify(exec);
module.exports = {
  getOSAndArch: () => {
    let osAndArch = '';

    if (platform == 'darwin') {
      osAndArch = 'mac';
    }

    if (platform == 'linux') {
      if (arch == 'x64') {
        osAndArch = 'linux-x86_64';
      }

      if (arch == 'x32') {
        osAndArch = 'linux-i686';
      }
    }

    if (platform == 'win32') {
      if (arch == 'x64') {
        osAndArch = 'win64';
      }

      if (arch == 'x32') {
        osAndArch = 'win32';
      }
    }

    if (osAndArch == '') {
      throw 'Platform not supported.';
    }

    return osAndArch;
  },
  getHTTPorHTTPs: osAndArch => {
    if (osAndArch == 'win32' || osAndArch == 'win64') {
      return https;
    }

    return http;
  },
  fixPath: (osAndArch, pathStr) => {
    if (osAndArch == 'win32' || osAndArch == 'win64') {
      return pathStr.split(path.sep).join(path.posix.sep);
    } // linux & mac


    return pathStr;
  },
  getPNPath: async osAndArch => {
    // const definitelyPosix = projectDir.split(path.sep).join(path.posix.sep);
    const homePath = await module.exports.getHomePath(osAndArch);
    return path.join(homePath, 'pointnetwork', 'pointnetwork');
  },
  getHomePath: async osAndArch => {
    if (osAndArch == 'win32' || osAndArch == 'win64') {
      // NOTE: `wsl echo $HOME` doesn't work.
      const cmd = `wsl realpath ~`;

      try {
        const result = await await execProm(cmd);
        return result.stdout.trim();
      } catch (ex) {
        throw ex;
      }
    }

    return os.homedir();
  },
  isDirEmpty: path => {
    return fs.readdirSync(path).length === 0;
  }
};

/***/ }),

/***/ "./src/installer/index.js":
/*!********************************!*\
  !*** ./src/installer/index.js ***!
  \********************************/
/***/ ((module) => {

class Installer {
  constructor() {}

  run() {
    console.log('----------RUNNING INSTALLER---------');
  }

}

module.exports = Installer;

/***/ }),

/***/ "7zip-min":
/*!***************************!*\
  !*** external "7zip-min" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("7zip-min");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ "dmg":
/*!**********************!*\
  !*** external "dmg" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("dmg");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("electron");

/***/ }),

/***/ "follow-redirects":
/*!***********************************!*\
  !*** external "follow-redirects" ***!
  \***********************************/
/***/ ((module) => {

"use strict";
module.exports = require("follow-redirects");

/***/ }),

/***/ "fs-extra":
/*!***************************!*\
  !*** external "fs-extra" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("fs-extra");

/***/ }),

/***/ "tar-fs":
/*!*************************!*\
  !*** external "tar-fs" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("tar-fs");

/***/ }),

/***/ "unbzip2-stream":
/*!*********************************!*\
  !*** external "unbzip2-stream" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("unbzip2-stream");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "process":
/*!**************************!*\
  !*** external "process" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("process");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*********************!*\
  !*** ./src/main.js ***!
  \*********************/
// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray,
  nativeImage
} = __webpack_require__(/*! electron */ "electron");

const path = __webpack_require__(/*! path */ "path");

const {
  platform,
  arch
} = __webpack_require__(/*! process */ "process");

const fs = __webpack_require__(/*! fs-extra */ "fs-extra");

const {
  exec
} = __webpack_require__(/*! child_process */ "child_process");

const url = __webpack_require__(/*! url */ "url");

const Installer = __webpack_require__(/*! ./installer */ "./src/installer/index.js");

const helpers = __webpack_require__(/*! ./helpers */ "./src/helpers/index.js");

const firefox = __webpack_require__(/*! ./firefox */ "./src/firefox/index.js");

const docker = __webpack_require__(/*! ./docker */ "./src/docker/index.js");

const INSTALLER_PATH = "~/.point/installer-finished";
let win;
let tray = null;

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1000,
    height: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'app.js')
    }
  }); // and load the index.html of the app.

  win.loadFile('app/app.html'); // Open the DevTools.
  // win.webContents.openDevTools()
}

function hasInstallerFinished() {
  return fs.pathExistsSync(INSTALLER_PATH);
} // This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.


app.whenReady().then(() => {
  if (!hasInstallerFinished()) {
    installer = new Installer();
    installer.run();
    return;
  }

  createWindow();
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  }); // Tray stuff.

  const iconPath = path.join(__dirname, 'resources/logo.ico');
  tray = new Tray(nativeImage.createFromPath(iconPath));
  const contextMenu = Menu.buildFromTemplate([{
    label: 'Show App',
    click: function () {
      win.show();
    }
  }, {
    label: 'Quit',
    click: function () {
      app.isQuiting = true;
      app.quit();
    }
  }]);
  tray.setToolTip('This is my application.');
  tray.setContextMenu(contextMenu);
  tray.on('right-click', () => {
    tray.popUpContextMenu();
  });
  tray.on('click', () => {
    win.show();
  });
  win.on('minimize', function (event) {
    event.preventDefault();
    win.hide();
  });
  win.on('close', function (event) {
    if (!app.isQuiting) {
      event.preventDefault();
      win.hide();
    }

    return false;
  });
}); // Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.

app.on('window-all-closed', function () {
  if (platform !== 'darwin') app.quit();
});
ipcMain.on("firefox-check", async (event, args) => {
  if (firefox.isInstalled()) {
    win.webContents.send("firefox-checked", true);
    return;
  }

  win.webContents.send("firefox-checked", false);
});
ipcMain.on("docker-check", async (event, args) => {
  const containerName = args.container;
  const osAndArch = helpers.getOSAndArch();
  const cmd = await docker.getHealthCmd(osAndArch, containerName);
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      win.webContents.send("docker-checked", { ...args,
        status: 'not running'
      });
      return;
    }

    const resp = JSON.parse(stdout);
    const status = resp != null ? resp.Status : 'no connection';
    win.webContents.send("docker-checked", {
      status: status,
      ...args
    });
  });
});
ipcMain.on("docker-logs", async (event, args) => {
  const containerName = args.container;
  const cmd = `x-terminal-emulator -e docker-compose -f ${compose} -f ${composeDev} logs -f ${containerName} && bash || bash`;
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }

    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
  });
});
ipcMain.on("platform-check", async (event, args) => {
  win.webContents.send("platform-checked", {
    os: platform,
    arch: arch
  });
});
ipcMain.on("firefox-run", (event, args) => {
  const cmd = firefox.getBinPath(helpers.getOSAndArch());
  exec(cmd, (error, stdout, stderr) => {
    win.webContents.send("firefox-closed");

    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }

    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }

    console.log(`stdout: ${stdout}`);
  });
});
ipcMain.on("firefox-download", async (event, args) => {
  const language = args.language;
  const version = '93.0b4';
  const browserDir = path.join('.', 'point-browser');
  const pacFile = url.pathToFileURL(path.join('..', 'pointnetwork', 'client', 'proxy', 'pac.js'));
  const osAndArch = helpers.getOSAndArch();
  const filename = firefox.getFileName(osAndArch, version);
  const releasePath = path.join(browserDir, filename);
  const firefoxRelease = fs.createWriteStream(releasePath);
  const firefoxURL = firefox.getURL(version, osAndArch, language, filename);

  if (!fs.existsSync(browserDir)) {
    fs.mkdirSync(browserDir);
  }

  const http_s = helpers.getHTTPorHTTPs(osAndArch, pacFile);
  await http_s.get(firefoxURL, async response => {
    await response.pipe(firefoxRelease);
    firefoxRelease.on('finish', () => {
      let cb = function () {
        win.webContents.send("firefox-installed");
        fs.unlink(releasePath, err => {
          if (err) {
            console.log(err);
          } else {
            console.log(`\nDeleted file: ${releasePath}`);
          }
        });
        firefox.createConfigFiles(osAndArch);
      };

      firefox.unpack(osAndArch, releasePath, browserDir, cb);
    });
  });
});
})();

/******/ })()
;
//# sourceMappingURL=main.js.map