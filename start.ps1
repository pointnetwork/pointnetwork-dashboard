$PN_DIR="$HOME/.point/src/pointnetwork"
$DASH_DIR="$HOME/.point/src/pointnetwork-dashboard"
$NODE_VER="v14.18.0"

if(!(test-path $PN_DIR) -or !(test-path $DASH_DIR)) {
    exit 1
}

cd $PN_DIR
git pull
cd $DASH_DIR
git pull
nvm use $NODE_VER
npm i
npm start
