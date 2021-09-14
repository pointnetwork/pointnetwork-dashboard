const helpers = require('../helpers');
const path = require('path');

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
