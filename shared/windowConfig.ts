const baseWindowConfig = {
  // icon: path.join(assetsPath, 'assets', 'icon.png'),
  autoHideMenuBar: true,
  resizable: false,
  maximizable: false,
  frame: false,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
  },
}

export default baseWindowConfig
