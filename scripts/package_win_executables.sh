#!/bin/bash

# This script will rename, add execution permissions and compress point executables.

VERSION=$(awk -F'"' '/"version": ".+"/{ print $4; exit; }' package.json)

DEB_FILE=./out/make/deb/x64/pointnetwork-dashboard_"$VERSION"_amd64.deb

WIN_FILE="./out/make/squirrel.windows/x64/pointnetwork-dashboard-${VERSION} Setup.exe"

mkdir -p ./out/win_executables/pkg
chmod +x "$WIN_FILE"
mv "$WIN_FILE" ./out/win_executables/pkg/point-dashboard.exe
tar -czvf ./out/win_executables/point-dashboard.tar.gz -C ./out/win_executables/pkg ./
