import installer, { Installer } from '../installer'
import dashboard from '../dashboard'
import welcome from '../welcome'
import helpers from '../../shared/helpers'
 export default async function main() {

  helpers.getPlatform()
  await helpers.getLastNodeVersion()
  const update = await Installer.checkNodeVersion()
  if (!(await Installer.isInstalled()) || update) {
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
