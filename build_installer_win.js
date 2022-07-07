 // To generate installer you need to install https://wixtoolset.org/releases/
// ./build_installer.js

// 1. Import Modules
const { MSICreator } = require('electron-wix-msi')
const path = require('path')
const fs = require('fs')

// 2. Define input and output directory.
// Important: the directories must be absolute, not relative e.g
// appDirectory: "C:\\Users\sdkca\Desktop\OurCodeWorld-win32-x64",
const APP_DIR = path.resolve(__dirname, './out/point-win32-x64')
// outputDirectory: "C:\\Users\sdkca\Desktop\windows_installer",
const OUT_DIR = path.resolve(__dirname, './out/pointDashboard_windows_installer')

const ICON_DIR = path.resolve(__dirname, './assets/multiformat.ico')
const BACKG_DIR_JPG = path.resolve(__dirname, './assets/background.jpg')
const BANNER_DIR_JPG = path.resolve(__dirname, './assets/banner.jpg')

// const signWithParams = `/debug /a '/f' ${path.resolve(process.env.WINDOWS_PFX_FILE)} /p ${process.env.WINDOWS_PFX_PASSWORD}`;
// const output = signWithParams.match(/(?:[^\s"]+|"[^"]*")+/g);

// console.log({xxx: process.env.WINDOWS_PFX_FILE, rx: process.env.WINDOWS_PFX_PASSWORD, signWithParams, output})




// 3. Instantiate the MSICreator
const msiCreator = new MSICreator({
    appDirectory: APP_DIR,
    outputDirectory: OUT_DIR,

    // Configure metadata
    description: 'Point Dashboard',
    exe: 'point',
    name: 'Point',
    manufacturer: 'PointNetwork',
    version: '1.0.0',
    appIconPath: ICON_DIR,
    certificateFile: process.env.WINDOWS_PFX_FILE,
    certificatePassword: process.env.WINDOWS_PFX_PASSWORD,
    // Configure installer User Interface
    ui: {
        chooseDirectory: true,
        images : {
            background: BACKG_DIR_JPG,
            banner: BANNER_DIR_JPG,
        }
    },
    features: {
        autoUpdate: true
    }
})

msiCreator.create().then(function(binaries) {
    // binaries.supportBinaries.forEach((filepath) => {
    //    if (filepath.match(/point.exe$/)) {
    //        // sign the binary
    //    }
    // })
    fs.copyFileSync(path.join(APP_DIR, 'point.exe'), path.join(OUT_DIR, 'point.exe'))
    msiCreator.compile().then(()=>{
        console.log('Compiled succesfully')
        process.exit(0)
    });

}).catch(err=>{
    console.log('Process error', err)
    process.exit(1)
})
