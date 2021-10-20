$PN_DIR="$HOME/.point/src/pointnetwork"
$DASH_DIR="$HOME/.point/src/pointnetwork-dashboard"
$SDK_DIR="$HOME/.point/src/pointsdk"
$NODE_VER="v14.18.0"

if(!(test-path $PN_DIR) -or !(test-path $DASH_DIR)) {
    exit 1
}

wsl --set-default ubuntu
wsl git --git-dir="$(wsl echo ~)/.point/src/pointnetwork/.git" pull

cd $PN_DIR
git pull
cd $SDK_DIR
git pull
cd $DASH_DIR
git pull
# nvm use $NODE_VER
npm i
npm start
