import * as fs from "fs";
import helpers from "../../shared/helpers";
import { BrowserWindow } from "electron";

const Mnemonic = require('bitcore-mnemonic');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const {getKeyFromMnemonic} = require('arweave-mnemonic-keys');

class WelcomeService {

    private win        
    private code = new Mnemonic();

    constructor(win: BrowserWindow) {
        this.win = win
    }

    async start() {
        // ?
    }

    async login(phrase: any, firstTime = false) {

        if (await helpers.isLoggedIn()) throw Error("Already logged in (~/.point/keystore/key.json already exists). You need to log out first.");

        if (!fs.existsSync(await helpers.getLiveDirectoryPath())) {
            fs.mkdirSync(await helpers.getLiveDirectoryPath());
        }

        const contents = JSON.stringify(phrase);
        fs.writeFileSync(await helpers.getKeyFileName(), contents);

        // arweave
        const arKey = getKeyFromMnemonic(phrase);
        fs.writeFileSync(await helpers.getArweaveKeyFileName(), JSON.stringify(arKey));

        return true;
    }

    async generate(){
        this.win.webContents.send("welcome:generated", this.code.toString());
    }

    async validate(message: any){

        this.win.webContents.send("welcome:confirmed", Mnemonic.isValid(message));
    }

    tryToShowError(e: any)
    {
        this.win.webContents.send("error", {e});
    }

}

export default WelcomeService;
