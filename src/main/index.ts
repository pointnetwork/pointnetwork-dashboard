import installer, { Installer } from '../installer'
;(async () => {
  if (!(await Installer.isInstalled())) {
    installer()
  } else {
    console.log('\n\nIs installed...Exiting\n')
    process.exit(0)
  }
})()
