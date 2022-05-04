 // To generate installer you need to install https://wixtoolset.org/releases/ 
// ./build_installer.js

// 1. Import Modules
const { MSICreator } = require('electron-wix-msi');
const path = require('path');

// 2. Define input and output directory.
// Important: the directories must be absolute, not relative e.g
// appDirectory: "C:\\Users\sdkca\Desktop\OurCodeWorld-win32-x64", 
const APP_DIR = path.resolve(__dirname, './out/pointnetwork-dashboard-win32-x64');
// outputDirectory: "C:\\Users\sdkca\Desktop\windows_installer", 
const OUT_DIR = path.resolve(__dirname, './out/pointDashboard_windows_installer');

const ICON_DIR = path.resolve(__dirname, './assets/multiformat.ico');
const BACKG_DIR_JPG = path.resolve(__dirname, './assets/background.jpg');
const BANNER_DIR_JPG = path.resolve(__dirname, './assets/banner.jpg');

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
    appIconPath : ICON_DIR,

    // Configure installer User Interface
    ui: {
        chooseDirectory: true,
        images : {
            background: BACKG_DIR_JPG,
            banner: BANNER_DIR_JPG,
        }
    },
});

// 4. Create a .wxs template file
msiCreator.create().then(function(){

    // Step 5: Compile the template to a .msi file
    msiCreator.compile().then(()=>{
        console.log('Compiled succesfully')
        process.exit(0)
    });
    
}).catch(err=>{
    console.log('Process error', err)
    process.exit(1)
});