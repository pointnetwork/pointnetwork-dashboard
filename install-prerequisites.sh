#!/bin/bash

# Use this command to run Point Installer:
#
# wget -qO- pointer.sh | wget

ask() {
    local prompt default reply

    if [[ ${2:-} = 'Y' ]]; then
        prompt='Y/n'
        default='Y'
    elif [[ ${2:-} = 'N' ]]; then
        prompt='y/N'
        default='N'
    else
        prompt='y/n'
        default=''
    fi

    while true; do

        # Ask the question (not using "read -p" as it uses stderr not stdout)
        echo -n "$1 [$prompt] "

        # Read the answer (use /dev/tty in case stdin is redirected from somewhere else)
        read -r reply </dev/tty

        # Default?
        if [[ -z $reply ]]; then
            reply=$default
        fi

        # Check if the reply is valid
        case "$reply" in
            Y*|y*) return 0 ;;
            N*|n*) return 1 ;;
        esac

    done
}

[[ ! -d "~/.point" ]] || (echo ">> Creating ~/.point directory"; mkdir -p ~/.point)

if [[ ! -d "~/.point/src" ]]; then
    echo ">> Creating ~/.point/src directory";
    mkdir -p ~/.point/src
fi

if [[ ! -d "~/.point/software" ]]; then
    echo ">> Creating ~/.point/software directory";
    mkdir -p ~/.point/software
fi

if [[ ! -d "~/.point/live" ]]; then
    echo ">> Creating ~/.point/live directory";
    mkdir -p ~/.point/live
fi

if ask ">> Do you want to update your package manager?"; then
    sudo apt-get update
fi

if ! command -v git &> /dev/null
then
    if ask ">> git not found. Do you want to install it?"; then
	sudo apt-get install git
    fi
fi

echo ">> Cloning PointNetwork into ~/.point/src";
git clone git@github.com:pointnetwork/pointnetwork.git ~/.point/src/pointnetwork

echo ">> Cloning PointNetwork Dashboard into ~/.point/src";
git clone git@github.com:pointnetwork/pointnetwork-dashboard.git ~/.point/src/pointnetwork-dashboard

if ! command -v wget &> /dev/null
then
    if ask ">> wget not found. Do you want to install it?"; then
	sudo apt-get install wget
    fi
fi

if ! command -v nvm &> /dev/null
then
    if ask ">> nvm not found. Do you want to install it?"; then
	wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
	. ~/.bashrc # this doesn't work (https://stackoverflow.com/questions/43659084/source-bashrc-in-a-script-not-working), so:
	### the following is from what nvm installs into .bashrc:
	export NVM_DIR="$HOME/.nvm"
	[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
    fi
fi

if ! command -v node &> /dev/null
then
    if ask ">> node.js not found. Do you want to install it?"; then
	if command -v nvm &> /dev/null
	then
	    echo ">> nvm is installed. Installing node.js version used by PointNetwork Dashboard"
	    cd ~/.point/src/pointnetwork-dashboard
	    nvm install
	    nvm use
	else
	    echo ">> nvm is not installed. Installing via package manager."
	    sudo apt-get install nodejs
	fi
    fi
fi

if ! command -v docker &> /dev/null
then
    if ask ">> docker not found. Do you want to install it?"; then
	sudo apt-get update
	sudo apt-get install apt-transport-https ca-certificates curl gnupg lsb-release
	sudo curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
	echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
	sudo apt-get update
	sudo apt-get install docker-ce docker-ce-cli containerd.io
    fi
fi

if ! command -v docker-compose &> /dev/null
then
    if ask ">> docker-compose not found. Do you want to install it?"; then
	sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
	sudo chmod +x /usr/local/bin/docker-compose
    fi
fi
