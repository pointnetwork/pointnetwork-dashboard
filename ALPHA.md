# Point Network Alpha Testing Guide

![alpha screenshot](resources/alpha_screenshot_2.png)

## Notes

- This is experimental alpha software! If you can and know how, better test it on a virtual machine first (fresh Ubuntu is recommended). If you are not tech-savvy, maybe wait for others to try it out first and see how it goes
- For extra security, we run the alpha node in a Docker container, sandboxing everything, just in case. Docker is used by millions of developers every day, however, please note that Docker might interfere with your firewall and open ports in some cases. We hope you are tech-savvy enough to know what this means and how it applies to your situation and network topology.
- Any troubles? Ask us in our Telegram group: [https://t.me/pointnetworkchat](https://t.me/pointnetworkchat)

## Installation

_Note: As a last resort measure, if you experience issues but still want to be recoded on the blockchain as one of the alpha testers (and in case we can't help you in the alpha testers group at [https://t.me/pointnetworkalpha](https://t.me/pointnetworkalpha)), try running it in an Ubuntu virtual machine. So far, Ubuntu users reported they experience the most smooth ride with one-command installation._

### Linux

1. Run `wget -qO- pointer.sh | bash` in the terminal, wait until completion
2. PointNetwork Dashboard will run after the script completes
3. In a terminal, run `point-up` to start Point Node
4. Wait until the icons on the dashboard turn green
   * Sometimes it takes time for the browser to download. In that case, if the browser doesn't launch automatically, you can click the browser icon from time to time.
5. PointBrowser will launch and you're ready to go!
6. Continue to "After Installation" section

### Mac OS

1. Run `curl -sL pointer.sh | bash -s` in Terminal, wait until completion
2. When Docker opens, accept the Terms
3. Run the script again: `curl -sL pointer.sh | bash -s`, and wait until completion
   * When dashboard opens and lights up green: sometimes it takes time for the browser to download. In that case, if the browser doesn't launch automatically, you can click the browser icon from time to time.
4. A `Point.app` should have been created inside `/Applications`. You can use this app to run the dashboard.
5. Continue to "After Installation" section

### Windows 10 and 11

#### Note: You're going to see a lot of red error messages about missing commands. This is expected. Only report errors that stop the installation process from continuing.
#### Note: Docker and WSL require reboots on Windows. Save your work first.

1. Install Docker if you don't have it already: https://docs.docker.com/desktop/windows/install/
   * It will ask you to reboot. Also, you need to accept the terms, and skip the tutorial
2. Install WSL2 by running in a terminal: `wsl --install -d Ubuntu`
3. Open a PowerShell terminal (not PowerShell ISE, not PowerShell x86, just PowerShell)
4. Run this in the PowerShell terminal: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser ; Invoke-WebRequest -Uri https://raw.githubusercontent.com/pointnetwork/pointnetwork-dashboard/main/install-windows.ps1 -OutFile ./install-windows.ps1; ./install-windows.ps1`
   * No need to worry about the warning that will be shown, for more details see here: https://stackoverflow.com/questions/64511176/security-risks-of-set-executionpolicy-executionpolicy-remotesigned
5. The script will ask you to restart your computer.
6. After restarting, if you didn't have WSL before, WSL will be configured
   1. Wait until WSL finishes configuring Ubuntu
   1. Set up your credentials (username and password) in the WSL terminal that is already open
7. Run again the script to open the Point Network Dashboard: `./install-windows.ps1`
   * Sometimes it takes time for the browser to download. In that case, if the browser doesn't launch automatically, you can click the browser icon from time to time.
8. Set up our Docker containers by running this command in a PowerShell terminal: `wsl docker-compose -f ~/.point/src/pointnetwork/docker-compose.yaml up -d`
9. If you ever wish to stop the containers, you can run `wsl docker-compose -f ~/.point/src/pointnetwork/docker-compose.yaml down -v`
10. Continue to "After Installation" section

## After Installation

1. Just follow the instructions for Point Dashboard
2. When you register a new secret phrase, and you want to test it again, don't lose it - it will qualify you to be on the list of alpha testers. Next time, you can just *log in* with this phrase instead of registering more one
3. Please report back to the group with screenshots, everyone would love to see each other's progress! https://t.me/pointnetworkchat
