#!/bin/bash

# Use this command to run Point Installer:
#
# wget -qO- pointer.sh | wget

echo "Point Network Installer installing..."

sudo apt install git nodejs -y || exit 1

# nvm
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
. ~/.bashrc # this doesn't work (https://stackoverflow.com/questions/43659084/source-bashrc-in-a-script-not-working), so:
### the following is from what nvm installs into .bashrc:
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

DASHBOARDDIR=$HOME/.point/dashboard
mkdir -p $DASHBOARDDIR
git clone https://github.com/pointnetwork/pointnetwork-dashboard $DASHBOARDDIR || echo "Already exists." # no exit because if it already exists, just update from git pull below
cd $DASHBOARDDIR || exit 1
git pull || exit 1 # update in case it's there but of sync

nvm install || exit 1
nvm use || exit 1
npm install || exit 1
npm start || exit 1