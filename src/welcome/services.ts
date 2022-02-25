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
        const arKey = getKeyFromMnemonic(phrase.phrase);
        fs.writeFileSync(await helpers.getArweaveKeyFileName(), JSON.stringify(arKey));

        // done
        if (global.platform.win32) {
            // const keyjson = '"C:\\Windows\\system32\\wsl.exe" cp "$("C:\\Windows\\system32\\wsl.exe" wslpath $("C:\\Windows\\system32\\wsl.exe" wslvar USERPROFILE))/.point/keystore/key.json" .';
            // const arjson = '"C:\\Windows\\system32\\wsl.exe" cp "$("C:\\Windows\\system32\\wsl.exe" wslpath $("C:\\Windows\\system32\\wsl.exe" wslvar USERPROFILE))/.point/keystore/arweave.json" .';
            const wslvar = 'wsl.exe wslvar USERPROFILE';
            const keyjson = 'wsl.exe cp "$(wsl.exe wslpath $(wsl.exe wslvar USERPROFILE))/.point/keystore/key.json" ~/.point/keystore/key.json';
            const arjson = 'wsl.exe cp "$(wsl.exe wslpath $(wsl.exe wslvar USERPROFILE))/.point/keystore/key.json" ~/.point/keystore/key.json';

            await new Promise<void>((resolve, reject) => {
                try {
                    console.log({keyjson, arjson});
                    console.log({wslvar});

                    // key.json
                    exec(wslvar, (error: { message: any; }, wslvarRes: string, stderr: string | undefined) => {
                        if (error) {
                            console.log(`error: ${error.message}`);
                            return reject(error);
                        }
                        if (stderr) {
                            console.log(`stderr: ${stderr}`);
                            return reject(new Error(stderr));
                        }
                        wslvarRes = wslvarRes.trim();
                        const wslPath = `wsl.exe wslpath "${wslvarRes}"`;
                        console.log({wslPath});

                        exec(wslPath, (error: { message: any; }, wslPathRes: string, stderr: string | undefined) => {
                            if (error) {
                                console.log(`error: ${error.message}`);
                                return reject(error);
                            }
                            if (stderr) {
                                console.log(`stderr: ${stderr}`);
                                return reject(new Error(stderr));
                            }
                            wslPathRes = wslPathRes.trim();
                            const wslCP = `wsl.exe cp -f "${wslPathRes}/.point/keystore/key.json" ~/.point/keystore/`;

                            console.log({wslPathRes});
                            console.log({wslCP});

                            exec(wslCP, (error: { message: any; }, wslCPRes: any, stderr: string | undefined) => {
                                if (error) {
                                    console.log(`error: ${error.message}`);
                                    return reject(error);
                                }
                                if (stderr) {
                                    console.log(`stderr: ${stderr}`);
                                    return reject(new Error(stderr));
                                }

                                console.log({wslPathRes});
                                const wslCP2 = `wsl.exe cp -f "${wslPathRes}/.point/keystore/arweave.json" ~/.point/keystore/`;

                                console.log({wslCP2});

                                exec(wslCP2, (error: { message: any; }, wslCP2Res: any, stderr: string | undefined) => {
                                    if (error) {
                                        console.log(`error: ${error.message}`);
                                        return reject(error);
                                    }
                                    if (stderr) {
                                        console.log(`stderr: ${stderr}`);
                                        return reject(new Error(stderr));
                                    }
                                    console.log({wslCP2Res});

                                    resolve();
                                });

                            });
                        });
                    });
                } catch(e) {
                    reject(e);
                }
            })
        }
        return true;

    }

    close() {
        this.win.close()
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
