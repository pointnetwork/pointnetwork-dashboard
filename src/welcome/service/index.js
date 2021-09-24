import * as fsExtra from "fs-extra";
import * as fs from "fs";
import * as path from "path";
import helpers, {getOSAndArch} from "../../helpers";
const util = require('util');
const exec = util.promisify(require('child_process').exec);
import * as axios from "axios";
const sudo = require('sudo-prompt');

class WelcomeService {

    constructor(win) {
    }

    async start() {

    }

}

export default WelcomeService;