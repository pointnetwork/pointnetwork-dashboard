#!/usr/bin/env bash
cd $HOME/.point/src/pointnetwork || exit 1
git pull
cd $HOME/.point/src/pointnetwork-dashboard || exit 1
git pull
nvm use
npm i
npm start