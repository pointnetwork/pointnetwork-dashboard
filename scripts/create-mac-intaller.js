const createDMG = require('electron-installer-dmg');

async function buildDMG() {
  await createDMG({
    appPath: './out/point-darwin-x64/point.app',
    name: 'point',
    out: './out',
    icon: './assets/icon.icns',
    overwrite: true,
    background: './assets/dmg-background.png',
    contents: [
      { x: 520, y: 370, type: 'link', path: '/Applications'},
      { x: 320, y: 370, type: 'file', path: './out/point-darwin-x64/point.app'}
    ],
    additionalDMGOptions: {
      "code-sign": {
        "signing-identity": 'Developer ID Application: POINT LABS FZCO (44K963DDUU)'
      }
    }
  });
}

buildDMG();
