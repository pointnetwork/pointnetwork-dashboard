#!/bin/bash

###############
##     OS    ##
###############

case "$OSTYPE" in
  linux*)   export PN_OS="LINUX" ;; # or WSL
  darwin*)  export PN_OS="MAC" ;;
  win*)     export PN_OS="WIN"; fail "Don't run this script under Windows" ;;
#  msys*)    echo "MSYS / MinGW / Git Bash" ;;
#  cygwin*)  echo "Cygwin" ;;
#  bsd*)     echo "BSD" ;;
#  solaris*) echo "Solaris" ;;
  *)        fail "unknown OS TYPE: $OSTYPE" ;;
esac

is_mac() {
  if [[ "$PN_OS" == "MAC" ]]; then
    return 0
  else
    return 1
  fi
}

is_linux() {
  if [[ "$PN_OS" == "LINUX" ]]; then
    return 0
  else
    return 1
  fi
}

## Most major distros support this:
if is_linux; then
  DISTRO=$(awk -F= '/^ID=/{print $2}' /etc/os-release)
elif is_mac; then
  DISTRO=MAC
else
  DISTRO=UNKNOWN
fi



try_source_nvm() {
    if [[ -f $HOME/.nvm/nvm.sh ]]; then
	    source $HOME/.nvm/nvm.sh
    fi
    if [[ -f $HOME/.bashrc ]]; then
	    source $HOME/.bashrc
    fi
}

try_source_nvm

#!/usr/bin/env bash
cd $HOME/.point/src/pointnetwork || exit 1
git pull
cd $HOME/.point/src/pointnetwork-dashboard || exit 1
git pull
nvm use > /dev/null 2>&1
npm i > /dev/null 2>&1

if is_linux; then
  echo "Point Dashboard needs sudo in order to access docker containers on Linux. Please enter below, or Ctrl-C for exit:"
  sudo npm start
else
  npm start
fi
