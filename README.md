# PointNetwork Dashboard

## Introduction

PointNetwork Dashboard serves the purpose of installing, configuring
and monitoring the multiple components that are part of the
PointNetwork ecosystem.

## Installation Scripts

You can first try to install all of the required
commands/dependencies/etc. using one of the installation scripts that
we provide in this repository. If a script is not working for you or
if we don't have an installation script for your operating system yet,
please check the section below (`Manual Installation`).

If you're on Windows, please set the execution policy to
`RemoteSigned` in a PowerShell terminal first: `Set-ExecutionPolicy
RemoteSigned -Scope CurrentUser` and then run the Windows installation
script.

| Step               | Debian/Ubuntu       | Windows               | MacOs    |
|--------------------|---------------------|-----------------------|----------|
| Name of the script | `install-debian.sh` | `install-windows.ps1` |          |
| Install commands   | &#9989;             | &#9989;               | &#10060; |
| Create directories | &#9989;             | &#10060;              | &#10060; |
| Clone repositories | &#9989;             | &#10060;              | &#10060; |
| Run the dashboard  | &#9989;             | &#10060;              | &#10060; |
| Install Firefox    | &#10060;            | &#10060;              | &#10060; |

## Manual Installation

1. You'll need to have installed: `git`, `nvm` (or just `node` 14),
   `docker`, `docker-compose`. The installation of these commands
   highly depend on your operating system. For Windows, use PowerShell
   to have a more consistent experience.
1. Create the following directories
   1. `mkdir $HOME/.point`
   1. `mkdir $HOME/.point/src`
   1. `mkdir $HOME/.point/software`
   1. `mkdir $HOME/.point/live`
1. `git clone` the following repositories:
   1. `git clone https://github.com/pointnetwork/pointnetwork-dashboard.git $HOME/.point/src/pointnetwork-dashboard`
   1. `git clone https://github.com/pointnetwork/pointnetwork.git $HOME/.point/src/pointnetwork`
1. Run the dashboard:
   1. `cd $HOME/.point/src/pointnetwork-dashboard`
   1. `nvm install && nvm use` (optional, if you don't have `node` 14 already installed)
   1. `npm install`
   1. `npm start`
