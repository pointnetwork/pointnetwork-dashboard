#!/bin/bash

# This script will rename, add execution permissions and compress point executables.

VERSION=$(awk -F'"' '/"version": ".+"/{ print $4; exit; }' package.json)

DEB_FILE=./out/make/deb/x64/point_"$VERSION"_amd64.deb
RPM_FILE=./out/make/rpm/x64/point-"$VERSION"-1.x86_64.rpm

mkdir -p ./out/linux_executables

mv $DEB_FILE ./out/linux_executables/point.deb
mv $RPM_FILE ./out/linux_executables/point.rpm


  chmod +x ./out/linux_executables/point.deb
  mkdir -p ./out/linux_executables/deb;
  mv ./out/linux_executables/point.deb ./out/linux_executables/deb;
  tar -czvf ./out/linux_executables/point-dashboard-deb.tar.gz -C ./out/linux_executables/deb/ ./point.deb;

  chmod +x ./out/linux_executables/point.rpm
  mkdir -p ./out/linux_executables/rpm;
  mv ./out/linux_executables/point.rpm ./out/linux_executables/rpm;
  tar -czvf ./out/linux_executables/point-dashboard-rpm.tar.gz -C ./out/linux_executables/rpm/ ./point.rpm;

