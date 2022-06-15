#!/bin/bash

# This script will rename, add execution permissions and compress point executables.

VERSION=$(awk -F'"' '/"version": ".+"/{ print $4; exit; }' package.json)

WIN_FILE="./out/pointDashboard_windows_installer/point.msi"
RELEASES_FILE="./out/make/squirrel.windows/x64/RELEASES"
NUPKG_FILE="./out/make/squirrel.windows/x64/point-$VERSION-full.nupkg"

echo '==='
pushd ./out/make/squirrel.windows/x64/
echo $VERSION
echo '==='
ls -al
popd
echo '==='

mkdir -p ./out/win_executables/pkg
chmod +x "$WIN_FILE"
mv "$WIN_FILE" ./out/win_executables/pkg/point.msi
mv "$RELEASES_FILE" ./out/win_executables/pkg/RELEASES
mv "$NUPKG_FILE" ./out/win_executables/pkg/point.nupkg
7z a ./out/win_executables/pointnetwork-windows_installer.zip ./out/win_executables/pkg/point.msi
