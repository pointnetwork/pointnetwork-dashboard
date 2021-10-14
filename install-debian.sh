#!/bin/bash

# Use this command to run Point Installer:
#
# Linux: wget -qO- pointer.sh | wget
# Mac: curl -sL pointer.sh | bash -s

###############
## Constants ##
###############

export CLICOLOR=1
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No color.

# Make sure 'nvm' comes first than 'node'.
CMDS=('git' 'wget' 'curl' 'nvm' 'node' 'docker' 'docker-compose')
export BRANCH="master"
export POINT_DIR="$HOME/.point"
export SRC_DIR="$POINT_DIR/src"
export SRC_PN_DIR="$SRC_DIR/pointnetwork"
export SRC_DASHBOARD_DIR="$SRC_DIR/pointnetwork-dashboard"
export SOFTWARE_DIR="$POINT_DIR/software"
export LIVE_DIR="$POINT_DIR/keystore"
DIRS=("$POINT_DIR" "$SRC_DIR" "$SOFTWARE_DIR" "$LIVE_DIR")

fail() {
  printf '%s\n' "$1" >&2  ## Send message to stderr. Exclude >&2 if you don't want it that way.
  exit "${2-1}"  ## Return a code specified by $2 or 1 by default.
}

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

###############
## Functions ##
###############

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
        echo -en "${RED}>>>${NC} $1 [$prompt] "

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

msg() {
    echo -e "${CYAN}>>>${NC} $1"
}

is_all_cmds_installed() {
    for cmd in "${CMDS[@]}"; do
      if ! command -v $cmd &> /dev/null
      then
          return 1
          break
      fi
    done
    return 0
}

install() {
    msg "Installing $1"
    if is_linux; then
      sudo apt-get --assume-yes install $1 || fail "apt-get install $1 failed"
    elif is_mac; then
      brew install $1 # || fail "brew install $1 failed"
    else
      fail "Unsupported system"
    fi
}

is_docker_group() {
    # getent group docker when installed yields: docker:x:997:username
    # getent after the script is run but not finalized yields: docker:x:997:username
    # yields empty when not installed
    if [[ $(getent group docker) && "$(getent group docker)" =~ $USER ]]; then
	    return 0
    fi
    return 1
}

get_desktop_shortcut_path() {
    DESKTOP_SHORTCUT_FILENAME=Point.desktop
    if is_linux; then
      echo "$(xdg-user-dir DESKTOP)/$DESKTOP_SHORTCUT_FILENAME"
    elif is_mac; then
      echo "$HOME/Desktop/$DESKTOP_SHORTCUT_FILENAME"
    else
      fail "Unsupported system"
    fi
}

install_docker() {
    msg "Installing docker"
    if is_linux; then
      sudo apt-get --assume-yes install apt-transport-https ca-certificates gnupg lsb-release
      sudo curl -fsSL https://download.docker.com/linux/$DISTRO/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
      echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/$DISTRO $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
      sudo apt-get update
      sudo apt-get --assume-yes install docker-ce docker-ce-cli containerd.io
      ## This is needed for not needing sudo
      if ! is_docker_group; then
#        msg "Creating docker group and adding current user '$USER' to it"
#        sudo groupadd docker || echo "Docker group already exists, skipping"
#        sudo usermod -aG docker $USER && echo "usermod -aG docker $USER - Done"
        #newgrp docker && echo "newgrp docker - Done" # Don't uncomment - throw the whole script off! No need to log into that group now
        # we'll be running it from sudo
        echo
      else
        msg "is_docker_group returned true, skipping creating docker groups"
      fi
    elif is_mac; then
      brew install homebrew/cask/docker || fail "Failed to install homebrew/cask/docker"
      msg "Docker installed, starting..."
      xattr -d -r com.apple.quarantine /Applications/Docker.app
      open -g -W -a /Applications/Docker.app
    else
      fail "Unsupported system"
    fi
    msg "Docker installed, continuing"
}

install_docker_compose() {
  if is_linux; then
    msg "Installing docker-compose"
    sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
  elif is_mac; then
    msg "Skipping docker-compose, should be installed automatically with docker"
  else
    fail "Unsupported system"
  fi
  msg "Docker-compose installed, continuing"
}

install_nvm() {
    msg "Installing nvm"
    wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
    # . ~/.bashrc # this doesn't work (https://stackoverflow.com/questions/43659084/source-bashrc-in-a-script-not-working), so:
    ### the following is from what nvm installs into .bashrc:
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
}

install_node() {
    msg "Installing node.js"
    if command -v nvm &> /dev/null
    then
      msg "nvm is installed. Installing node.js version used by PointNetwork Dashboard"

      install npm

      ## Creating directories needed by PointNetwork
      make_pn_dirs
      ## Cloning repositories
      clone_pn_dashboard

      cd "$SRC_DASHBOARD_DIR" || fail "Could not cd into $SRC_DASHBOARD_DIR"
      nvm install
      nvm use
    else
      msg "nvm is not installed. Installing via package manager."
      install nodejs npm
    fi
}

try_source_nvm() {
    if [[ -f $HOME/.nvm/nvm.sh ]]; then
	    source $HOME/.nvm/nvm.sh
    fi
    if [[ -f $HOME/.bashrc ]]; then
	    source $HOME/.bashrc
    fi
}

echo_welcome() {
    if [[ ! -d ~/.point ]]; then
      msg
      msg "Welcome to PointNetwork Installer"
      msg
      msg "This script creates necessary directories inside $HOME/.point,"
      msg "installs some commands using your operating system's package manager"
      msg "and clones all the required PointNetwork repositories inside $HOME/.point/src."
      msg
      msg "By continuing, you agree to Terms of Use for Point Network (https://pointnetwork.io/pages/terms)"
      msg
      msg "The commands that this script will install are:"
      msg
      msg "${CMDS[*]}"
      msg
      if ask "Do you want to continue?"; then
          msg # separate sudo password ask from current ask with one line

          # Keep sudo priveleges: https://gist.github.com/cowboy/3118588
          # Ask upfront
          sudo -v

          # Keep-alive: update existing sudo time stamp if set, otherwise do nothing.
          # This subprocess will die with the current script exiting
          while true; do sudo -n true; sleep 60; kill -0 "$$" || exit; done 2>/dev/null &

          msg
          msg "OS detected: OSTYPE=[$OSTYPE] PNOS=[$PN_OS]"
          msg
          msg "Continuing..."
      else
          msg "Exiting"
          exit
      fi
    fi
}

make_pn_dirs() {
    for dir in "${DIRS[@]}"; do
      if [[ ! -d "$dir" ]]; then
          msg "Creating $dir directory"
          mkdir -p "$dir"
      fi
    done
}

update_pn() {
    msg "Updating PointNetwork";
    git -C "$SRC_PN_DIR" pull
}

update_pn_dashboard() {
    msg "Updating PointNetwork Dashboard";
    git -C "$SRC_DASHBOARD_DIR" pull
}

is_pn_installed() {
    if [[ -d "$SRC_PN_DIR" ]]; then
	    return 0
    fi
    return 1
}

is_pn_dashboard_installed() {
    if [[ -d "$SRC_DASHBOARD_DIR" ]]; then
	    return 0
    fi
    return 1
}

is_pn_sdk_installed() {
    if [[ -d "$SRC_DIR/pointsdk" ]]; then
	    return 0
    fi
    return 1
}

is_all_pn_installed() {
    if is_pn_installed && is_pn_dashboard_installed; then
    	return 0
    fi
    return 1
}

clone_pn() {
    if ! is_pn_installed; then
      msg "Cloning PointNetwork";
      git clone https://github.com/pointnetwork/pointnetwork "$SRC_PN_DIR"
    fi
}

clone_pn_dashboard() {
    if ! is_pn_dashboard_installed; then
      msg "Cloning PointNetwork Dashboard";
      git clone https://github.com/pointnetwork/pointnetwork-dashboard "$SRC_DASHBOARD_DIR"
    fi
    cd "$SRC_DASHBOARD_DIR"
}

clone_pn_sdk() {
    if ! is_pn_sdk_installed; then
      msg "Cloning PointSDK";
      git clone https://github.com/pointnetwork/pointsdk "$SRC_DIR/pointsdk"
    fi
}

copy_browser_profile() {
  cp -r "$SRC_DASHBOARD_DIR/liveprofile" "$LIVE_DIR/profile"
}

run_pn_dashboard() {
    cd "$SRC_DASHBOARD_DIR"
    msg "Installing required node.js version"
    nvm install > /dev/null 2>&1
    msg "Changing to required node.js version"
    nvm use > /dev/null 2>&1
    msg "Installing required node.js packages using npm"
    npm install > /dev/null 2>&1

    # after this newgrp line below, no other part of the script should be used
    # https://unix.stackexchange.com/questions/18897/problem-while-running-newgrp-command-in-script
    msg "Starting PointNetwork Dashboard"
    SHORTCUT_FILE=$(get_desktop_shortcut_path) || fail "get_desktop_shortcut_path failed"
#    newgrp docker

    sudo chmod -x "$SHORTCUT_FILE"
    gio set $SHORTCUT_FILE metadata::trusted true
    sudo chmod +x "$SHORTCUT_FILE"

    nohup "$SRC_DASHBOARD_DIR/start.sh" </dev/null >/dev/null 2>&1 &

    msg "Done! Launching Dashboard..."
}

is_all_installed() {
    if is_all_pn_installed && is_all_cmds_installed; then
      msg
      msg "Congratulations, you have all the necessary components to run PointNetwork!"
      msg ""
      msg
    else
      fail "Something is wrong. Not all commands are installed. Please check the logs"
    fi
}

maybe_update_package_manager() {
    if ! is_all_cmds_installed
    then
      msg "Updating list of available packages in package manager."
      msg
      if is_linux; then
        if ! sudo apt-get update ; then
            fail "There was an error while trying to update list of available packages via apt-get."
        fi
      elif is_mac; then
        if ! is_brew_installed; then
          install_brew
        fi
        if ! brew update ; then
            fail "There was an error while trying to update list of available packages via brew."
        fi
      fi
    fi
}

is_brew_installed() {
  if brew -v; then
    return 0
  else
    return 1
  fi
}

install_brew() {
  msg "Installing brew..."
  # https://brew.sh/
  # https://stackoverflow.com/questions/24426424/unattended-no-prompt-homebrew-installation-using-expect
  URL_BREW='https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh'
  echo | /bin/bash -c "$(curl -fsSL $URL_BREW)"

  if [ $? -eq 0 ]; then msg 'OK'; else fail 'Error installing brew'; fi
}

install_commands() {
    for cmd in "${CMDS[@]}"; do
      if ! command -v $cmd &> /dev/null
      then
          case $cmd in
            "nvm")
                install_nvm
                ;;
            "node")
                install_node
                ;;
            "docker")
                install_docker
                ;;
            "docker-compose")
                install_docker_compose
                ;;
            *)
                install $cmd
                ;;
          esac
      fi
    done
}

create_desktop_shortcut() {
    SHORTCUT_FILE=$(get_desktop_shortcut_path) || fail "get_desktop_shortcut_path failed"
    if [[ -f $SHORTCUT_FILE ]]; then
	rm $SHORTCUT_FILE
    fi
    START_SCRIPT="$SRC_DASHBOARD_DIR/start.sh"
    tee "$SHORTCUT_FILE" <<SHORTCUT >/dev/null
[Desktop Entry]
Version=0.1
Name=Point
Comment=Decentralized Internet
Exec="$START_SCRIPT"
Icon=$SRC_DASHBOARD_DIR/resources/pointlogo_any_bg.png
Terminal=true
Type=Application
Categories=Utility;Application;
SHORTCUT
    sudo chmod -x "$SHORTCUT_FILE"
    gio set $SHORTCUT_FILE metadata::trusted true
    sudo chmod +x "$SHORTCUT_FILE"
}

create_aliases() {
    sudo tee "/usr/bin/point-up" <<FILE >/dev/null
#!/bin/bash
cd $SRC_PN_DIR
git checkout $BRANCH
git pull
CMD="export POINT_KEYSTORE=$POINT_DIR/keystore; docker-compose up -d"
if [[ $(uname) == 'Darwin' ]]; then
  bash -c "\$CMD"
else
  sudo bash -c "\$CMD"
fi
FILE
    sudo tee "/usr/bin/point-down" <<FILE >/dev/null
#!/bin/bash
cd $SRC_PN_DIR
CMD="npm run stop:znet"
if [[ $(uname) == 'Darwin' ]]; then
  bash -c "\$CMD"
else
  sudo bash -c "\$CMD"
fi
FILE
    sudo tee "/usr/bin/point-start" <<FILE >/dev/null
#!/bin/bash
cd $SRC_DASHBOARD_DIR
git pull
./start.sh
FILE

    sudo chmod +x "/usr/bin/point-up"
    sudo chmod +x "/usr/bin/point-down"
    sudo chmod +x "/usr/bin/point-start"
}

download_docker_images() {
  sudo bash -c "cd $SRC_PN_DIR || exit 1; git checkout $BRANCH; docker-compose pull"
}

## Welcome message
echo_welcome

## If nvm has already been installed, we need to source it.
try_source_nvm

## Checking if we'll need to install some commands.
## If we do, let's update list of packages.
maybe_update_package_manager

## Installing necessary commands, if missing.
install_commands

## Creating directories needed by PointNetwork
make_pn_dirs

## Cloning repositories
clone_pn
clone_pn_dashboard
clone_pn_sdk
copy_browser_profile

## Update code just in case
update_pn
update_pn_dashboard

## Checking first if everything's already installed.
## In this case we can just update and run the dashboard.
is_all_installed

# Create desktop shortcut
create_desktop_shortcut
create_aliases

download_docker_images

# Start dashboard
#if ask "Do you want to run PointNetwork Dashboard?"; then
#    msg
run_pn_dashboard
#fi
