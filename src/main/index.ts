import installer, { Installer } from '../installer'
import dashboard from '../dashboard'
import AutoLaunch from 'auto-launch'
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

  const pointAutoLauncher = new AutoLaunch({
    name: 'point',
    path: '/Applications/point.app',
  });

  pointAutoLauncher.enable();

  // pointAutoLauncher.disable();


  pointAutoLauncher.isEnabled()
    .then(function (isEnabled) {
      if (isEnabled) {
        return;
      }
      pointAutoLauncher.enable();
    })
    .catch(function () {
      // handle error
    });
  main()
})()
