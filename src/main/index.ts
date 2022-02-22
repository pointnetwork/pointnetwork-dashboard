import installer, { Installer } from '../installer'
import dashboard from '../dashboard'
import welcome from '../welcome'
import helpers from '../../shared/helpers'
 export default async function main() {
  helpers.getPlatform()
  if (!(await Installer.isInstalled())) {
    installer()
  } else {
    if (! await helpers.isLoggedIn()) {
      welcome()
    } else {
      dashboard()
    }

  }
 }

  ; (async () => {
    main()
  })()
