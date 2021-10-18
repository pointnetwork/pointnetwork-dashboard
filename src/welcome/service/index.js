import * as fsExtra from "fs-extra";
import * as fs from "fs";
import * as path from "path";
import helpers, {getOSAndArch} from "../../helpers";

const util = require('util');
const exec = util.promisify(require('child_process').exec);
import * as axios from "axios";

const sudo = require('sudo-prompt');
const bip39 = require('bip39');
const {getKeyFromMnemonic} = require('arweave-mnemonic-keys');

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

        const contents = JSON.stringify({phrase: phrase});
        fs.writeFileSync(await helpers.getKeyFileName(), contents);

        // arweave
        let arKey = getKeyFromMnemonic(phrase);
        fs.writeFileSync(await helpers.getArweaveKeyFileName(), JSON.stringify(arKey));

        // done
        const osAndArch = helpers.getOSAndArch();
        if (osAndArch == 'win32' || osAndArch == 'win64') {
            // const keyjson = '"C:\\Windows\\system32\\wsl.exe" cp "$("C:\\Windows\\system32\\wsl.exe" wslpath $("C:\\Windows\\system32\\wsl.exe" wslvar USERPROFILE))/.point/keystore/key.json" .';
            // const arjson = '"C:\\Windows\\system32\\wsl.exe" cp "$("C:\\Windows\\system32\\wsl.exe" wslpath $("C:\\Windows\\system32\\wsl.exe" wslvar USERPROFILE))/.point/keystore/arweave.json" .';
            const wslvar = 'wsl.exe wslvar USERPROFILE';
            const keyjson = 'wsl.exe cp "$(wsl.exe wslpath $(wsl.exe wslvar USERPROFILE))/.point/keystore/key.json" ~/.point/keystore/key.json';
            const arjson = 'wsl.exe cp "$(wsl.exe wslpath $(wsl.exe wslvar USERPROFILE))/.point/keystore/key.json" ~/.point/keystore/key.json';

            console.log({keyjson, arjson});
            console.log({wslvar});

            // key.json
            exec(wslvar, (error, wslvarRes, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    return;
                }
                wslvarRes = wslvarRes.trim();
                const wslPath = `wsl.exe wslpath "${wslvarRes}"`;
                console.log({wslPath});

                exec(wslPath, (error, wslPathRes, stderr) => {
                    if (error) {
                        console.log(`error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.log(`stderr: ${stderr}`);
                        return;
                    }
                    wslPathRes = wslPathRes.trim();
                    const wslCP = `wsl.exe cp "${wslPathRes}/.point/keystore/key.json" ~/.point/keystore/`;

                    console.log({wslPathRes});
                    console.log({wslCP});

                    exec(wslCP, (error, wslCPRes, stderr) => {
                        if (error) {
                            console.log(`error: ${error.message}`);
                            return;
                        }
                        if (stderr) {
                            console.log(`stderr: ${stderr}`);
                            return;
                        }

                        console.log({wslPathRes});
                        const wslCP2 = `wsl.exe cp "${wslPathRes}/.point/keystore/arweave.json" ~/.point/keystore/`;

                        console.log({wslCP2});

                        exec(wslCP2, (error, wslCP2Res, stderr) => {
                            if (error) {
                                console.log(`error: ${error.message}`);
                                return;
                            }
                            if (stderr) {
                                console.log(`stderr: ${stderr}`);
                                return;
                            }
                            console.log({wslCP2Res});
                        });

                    });
                });

                // arweave.json
                /* exec(arjson, (error, stdout, stderr) => {
                    if (error) {
                        console.log(`error: ${error.message}`);
                        return;
                    }
                    if (stderr) {
                        console.log(`stderr: ${stderr}`);
                        return;
                    }

                });
            */
            });

            this.win.webContents.send("loggedIn");

            return true;
        }

        tryToShowError(e)
        {
            this.win.webContents.send("error", {e});
        }

    }
}

export default WelcomeService;
