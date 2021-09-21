#!/bin/bash

# Use this command to run Point Installer:
#
# wget -qO- pointer.sh | wget

echo "Point Network Installer installing..."
sudo apt install git nodejs -y || exit 1
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
. ~/.bashrc || exit 1
DASHBOARDDIR=$HOME/.point/dashboard
mkdir -p $DASHBOARDDIR
git clone https://github.com/pointnetwork/pointnetwork-dashboard $DASHBOARDDIR # no exit because if it already exists, just update from git pull below
cd $DASHBOARDDIR || exit 1
git pull || exit 1 # update in case it's there but of sync
nvm install || exit 1
nvm use || exit 1
npm install || exit 1
npm start || exit 1