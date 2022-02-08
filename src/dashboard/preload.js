const process = require('process');
const {
    contextBridge,
    ipcRenderer
} = require("electron");

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type]);
    }
});

contextBridge.exposeInMainWorld(
    "api", {
        send: (channel, data) => {
            // whitelist channels
            let validChannels = ["platform-check",
                                 "firefox-check",
                                 "firefox-download",
                                 "docker-download",
                                 "firefox-run",
                                 "firefox-dialog-install",
                                 "docker-check",
                                 "docker-check-installed",
                                 "docker-logs",
                                 "point-node-check",
                                 "docker-run",
                                 "docker-close",
                                 "logout",
                                 "open-docker-logs-node",
                                 "open-docker-logs-database",
                                 "stop-docker"
                                ];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        receive: (channel, func) => {
            let validChannels = ["firefox-checked",
                                 "firefox-closed",
                                 "firefox-installed",
                                 "platform-checked",
                                 "docker-checked",
                                 "docker-checked-installed",
                                 "point-node-checked",
                                 "docker-log"                                 
                                 ];
            if (validChannels.includes(channel)) {
                // Deliberately strip event as it includes `sender` 
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        }
    }
);
