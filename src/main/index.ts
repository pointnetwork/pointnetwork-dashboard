import installer, { Installer } from '../installer'
import dashboard from '../dashboard'
import helpers from '../../shared/helpers'
;(async () => {
  helpers.getPlatform()
  if (!(await Installer.isInstalled())) {
    installer()
  } else {
    dashboard()
  }
})()
