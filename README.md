# PointNetwork Dashboard

## Introduction

PointNetwork Dashboard serves the purpose of installing, configuring
and monitoring the multiple components that are part of the
PointNetwork ecosystem.

## Getting started

For regular users:

1. You'll need to have installed: `git`, `nvm` (or just `node` 14), `docker`, `docker-compose`. The installation of these commands highly depend on your operating system
1. Create the following directories
   1. "$HOME/.point"
   1. "$HOME/.point/src"
   1. "$HOME/.point/software"
   1. "$HOME/.point/live"
1. `git clone` the following repositories:
   1. `git clone https://github.com/pointnetwork/pointnetwork-dashboard.git $HOME/.point/src/pointnetwork-dashboard`
   1. `git clone https://github.com/pointnetwork/pointnetwork.git $HOME/.point/src/pointnetwork`
1. Run the dashboard:
   1. `cd $HOME/.point/src/pointnetwork-dashboard`
   1. `nvm install && nvm use` (optional, if you don't have `node` 14 already installed)
   1. `npm install`
   1. `npm start`

| Step               | Debian/Ubuntu       | Windows               | MacOs    |
|--------------------|---------------------|-----------------------|----------|
| Name of the script | `install-debian.sh` | `install-windows.ps1` |          |
| Install commands   | &#9989;             | &#9989;               | &#10060; |
| Create directories | &#9989;             | &#9989;               | &#10060; |
| Clone repositories | &#9989;             | &#9989;               | &#10060; |
| Run the dashboard  | &#9989;             | &#9989;               | &#10060; |
|                    |                     |                       |          |
