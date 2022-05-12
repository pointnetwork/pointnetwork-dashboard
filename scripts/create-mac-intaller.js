const createDMG = require('electron-installer-dmg');

async function buildDMG() {
  await createDMG({
    appPath: './out/point-darwin-x64/point.app',
    name: 'point',
    out: './out',
    icon: './assets/icon.icns',
    overwrite: true,
    additionalDMGOptions: {
      "code-sign": {
        "signing-identity": 'Developer ID Application: POINT LABS FZCO (44K963DDUU)'
      }
    }
  });
}

buildDMG();
