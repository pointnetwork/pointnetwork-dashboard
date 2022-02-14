import Installer from '../installer/service'
import installer from '../installer/main'
;(async () => {
  if (!(await Installer.isInstalled())) {
    installer()
  } else {
    console.log('\n\nIs installed...Exiting\n')
    process.exit(0)
  }
})()
