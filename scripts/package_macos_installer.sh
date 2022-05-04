#!/bin/bash

# This script will rename, add execution permissions and compress point executables.

MAC_FILE=./out/point.dmg

mkdir -p ./out/mac_executables/pkg
chmod +x $MAC_FILE
mv $MAC_FILE ./out/mac_executables/pkg/point.dmg
tar -czvf ./out/mac_executables/point-dmg.tar.gz -C ./out/mac_executables/pkg ./point.dmg
