#!/bin/bash

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
npm start
