#!/bin/bash

sudo apt install git nodejs -y || exit 1
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
source ~/.bashrc || exit 1
git clone https://github.com/pointnetwork/pointnetwork-dashboard || exit 1
cd pointnetwork-dashboard || exit 1
nvm install || exit 1
nvm use || exit 1
npm install || exit 1
npm start || exit 1