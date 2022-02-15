import installer, { Installer } from '../installer'
import  dashboard from '../dashboard'
import { Helpers } from '../../shared/helpers'
;(async () => {
  const helpers = new Helpers()
  helpers.getPlatform()
  if (!(await Installer.isInstalled())) {
    installer()
  } else {
    dashboard()
  }
})()
