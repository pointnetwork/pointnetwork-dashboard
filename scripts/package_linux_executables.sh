#!/bin/bash

# This script will rename, add execution permissions and compress point executables.

VERSION=$(awk -F'"' '/"version": ".+"/{ print $4; exit; }' package.json)

DEB_FILE=./out/make/deb/x64/point_"$VERSION"amd64.deb
RPM_FILE=./out/make/rpm/x64/point-"$VERSION"1.x86_64.rpm

mkdir -p ./out/linux_executables

mv $DEB_FILE ./out/linux_executables/point.deb
mv $RPM_FILE ./out/linux_executables/point.rpm

for FILE in ./out/linux_executables/*; do
  chmod +x $FILE
  tmp=${FILE#*-};
  EXTENSION=${tmp#*\.};
  mkdir -p ./out/linux_executables/$EXTENSION;
  mv $FILE ./out/linux_executables/$EXTENSION;
  tar -czvf ./out/linux_executables/point-dashboard-$EXTENSION.tar.gz -C ./out/linux_executables/$EXTENSION/ ./point.$EXTENSION;
done
