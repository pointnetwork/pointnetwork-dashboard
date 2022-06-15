#!/bin/bash

# This script will rename, add execution permissions and compress point executables.

MAC_FILE=./out/point-darwin-x64/point.app

mkdir -p ./out/mac_executables/zip
chmod +x $MAC_FILE
mv $MAC_FILE ./out/mac_executables/zip/point.app
pushd ./out/mac_executables/zip/
zip -r -y point.zip point.app
popd

echo '---'
ls -al .
echo '---'
ls -al out
echo '---'
ls -al out/mac_executables/
echo '---'
ls -al out/mac_executables/zip
echo '---'
