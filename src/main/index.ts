import installer, { Installer } from '../installer'
import dashboard from '../dashboard'
import welcome from '../welcome'
import helpers from '../../shared/helpers'
import Logger from '../../shared/logger'
import { app, dialog } from 'electron'

// Disable error dialogs by overriding
dialog.showErrorBox = function(title, content) {
  logger.info(`${title}\n${content}`)
};

const logger = new Logger()

export default async function main() {
  if (require('electron-squirrel-startup')) return app.quit()

  logger.info('Checking for updates')
  require('update-electron-app')()
  logger.info('Launching Dashboard')

  helpers.getPlatform()
  if (!(await Installer.isInstalled())) {
    installer()
  } else {
    if (!(await helpers.isLoggedIn())) {
      welcome()
    } else {
      dashboard()
    }
  }
}

;(async () => {
  main()
})()
