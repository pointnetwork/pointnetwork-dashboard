# Point Network Alpha Testing Guide

### Linux

1. Run `wget -qO- pointer.sh | bash` in the terminal, wait until completion

### Mac OS

1. Run `curl -sL pointer.sh | bash -s` in Terminal, wait until completion

### Windows 10 and 11

1. Open a PowerShell terminal
1. Download installation script: `Invoke-WebRequest -Uri https://raw.githubusercontent.com/pointnetwork/pointnetwork-dashboard/main/install-windows.ps1 -OutFile ./install-windows.ps1`
1. Set execution policy to RemoteSigned: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser;`
1. Run the script: `./install-windows.ps1`
1. The script will ask you to restart your computer.
1. After restarting, if you didn't have WSL before, WSL will be configured
   1. Wait until WSL finishes configuring Ubuntu
   1. Set up your credentials (username and password) in the WSL terminal that is already open
1. If you didn't have Docker before, please accept Docker's Terms of Service
1. Run again the script to open the Point Network Dashboard: `./install-windows.ps1`
