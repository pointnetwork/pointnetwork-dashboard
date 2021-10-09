import * as fsExtra from "fs-extra";
import * as fs from "fs";
import * as path from "path";
import helpers, {getOSAndArch} from "../../helpers";
const util = require('util');
const exec = util.promisify(require('child_process').exec);
import * as axios from "axios";
const sudo = require('sudo-prompt');
const bip39 = require('bip39');
const { getKeyFromMnemonic } = require('arweave-mnemonic-keys');

class WelcomeService {

    constructor(win) {
        this.win = win;
    }

    async start() {
        // ?
    }

    async login(phrase, firstTime = false) {
        if (!bip39.validateMnemonic(phrase)) throw Error('Entered secret phrase didn\'t pass the validation!');

        if (await helpers.isLoggedIn()) throw Error("Already logged in (~/.point/keystore/key.json already exists). You need to log out first.");

        if (!fs.existsSync(await helpers.getLiveDirectoryPath())) {
            fs.mkdirSync(await helpers.getLiveDirectoryPath());
        }

        const contents = JSON.stringify({ phrase: phrase });
        fs.writeFileSync(await helpers.getKeyFileName(), contents);

        // arweave
        let arKey = getKeyFromMnemonic(phrase);
        fs.writeFileSync(await helpers.getArweaveKeyFileName(), JSON.stringify(arKey));

        // done

        this.win.webContents.send("loggedIn");

        return true;
    }

    tryToShowError(e) {
        this.win.webContents.send("error", { e });
    }

}

export default WelcomeService;