#!/bin/bash

# This script will rename, add execution permissions and compress point executables.

VERSION=$(awk -F'"' '/"version": ".+"/{ print $4; exit; }' package.json)

WIN_FILE="./out/pointDashboard_windows_installer/point.msi"

mkdir -p ./out/win_executables/pkg
chmod +x "$WIN_FILE"
mv "$WIN_FILE" ./out/win_executables/pkg/point.msi
7z a ./out/win_executables/pointnetwork-windows_installer.zip ./out/win_executables/pkg/point.msi
