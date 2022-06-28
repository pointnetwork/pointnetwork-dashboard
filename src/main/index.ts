import installer, { Installer } from '../installer'
import dashboard from '../dashboard'
import welcome from '../welcome'
import helpers from '../../shared/helpers'
import Logger from '../../shared/logger'

const logger = new Logger()

export default async function main() {
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
