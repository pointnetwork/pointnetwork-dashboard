#!/bin/bash

# This script will rename, add execution permissions and compress point executables.

MAC_FILE=./out/pointnetwork-dashboard.dmg

mkdir -p ./out/mac_executables/pkg
chmod +x $MAC_FILE
mv $MAC_FILE ./out/mac_executables/pkg/point-dashboard.dmg
tar -czvf ./out/mac_executables/point-dashboard-dmg.tar.gz -C ./out/mac_executables/pkg ./point-dashboard.dmg
