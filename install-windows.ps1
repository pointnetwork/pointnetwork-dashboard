if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))  
{  
    $arguments = "& '" +$myinvocation.mycommand.definition + "'"
    Start-Process powershell -Verb runAs -ArgumentList $arguments
    Break
}

$CMDS = @('choco', 'git', 'wget', 'curl', 'python', 'wsl', 'nvm', 'docker')
# Without WSL:
# $CMDS = @('choco', 'git', 'wget', 'curl', 'nvm', 'node', 'docker')
$BRANCH="master"
$POINT_DIR="$HOME\.point"
$SRC_DIR="$POINT_DIR\src"
$SRC_PN_DIR="$SRC_DIR\pointnetwork"
$SRC_DASHBOARD_DIR="$SRC_DIR\pointnetwork-dashboard"
$SRC_SDK_DIR="$SRC_DIR\pointsdk"
$SOFTWARE_DIR="$POINT_DIR\software"
$LIVE_DIR="$POINT_DIR\keystore"
$NODE_VERSION="v14.18.0"
$RESTARTED="$POINT_DIR/restarted"

# choco install nodejs --version 14.18.0

function Msg($msg) {
    Write-Host ">>> " -ForegroundColor Red -NoNewline
    Write-Host $msg
}

function Ask($msg) {
    $choices = New-Object Collections.ObjectModel.Collection[Management.Automation.Host.ChoiceDescription]
    $choices.Add((New-Object Management.Automation.Host.ChoiceDescription -ArgumentList '&Yes'))
    $choices.Add((New-Object Management.Automation.Host.ChoiceDescription -ArgumentList '&No'))

    $msg = Msg($msg)
    

    $decision = $Host.UI.PromptForChoice("", $msg, $choices, 1)

    return $decision -eq 0
}

function Test-WSLInstalled() {
    # The command `wsl` is present in all new Windows versions.
    # We need to test if a Linux Subsystem has been installed.
    # To do this, we can check if `wslconfig` is present in the system.
    return $(If (Get-Command wslconfig -errorAction SilentlyContinue) {$true} Else {$false})
}

function Test-Command($cmd) {
    switch ($cmd)
    {
	'wsl' {
	    if(-Not(Test-WSLInstalled)) {
		return $false

	    }
	}
	default {
	    if(-Not(Get-Command $cmd -errorAction SilentlyContinue)) {
		return $false
	    }
	}
    }
    return $true
}

function Test-AllCommandsExist() {
    foreach ($cmd in $CMDS) {
	if(-Not(Test-Command($cmd))) {
	    return $false
	}
    }
    return $true
}

function Install($cmd) {
    Msg "Installing $cmd"
    choco feature enable -n allowGlobalConfirmation
    choco install $cmd --yes -y
}

function Install-Chocolatey() {
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    choco feature enable -n allowGlobalConfirmation
}

function Install-WSL() {
    wsl --install -d Ubuntu
}

function Install-Docker() {
    If(!(test-path $SOFTWARE_DIR\Docker.exe)) {
	Msg("Downloading Docker")
	Invoke-WebRequest "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" -OutFile $SOFTWARE_DIR\Docker.exe
    }
    Msg("Installing Docker")
    & $SOFTWARE_DIR/Docker.exe install --quiet --norestart | Out-Null
}

function Remove-Docker() {
    Remove-Item $SOFTWARE_DIR/Docker.exe
}

function Install-Commands() {
    foreach ($cmd in $CMDS) {
	if (Test-Command($cmd)) {
	    # Already installed. Continue.
	    continue
	}
	switch ($cmd)
	{
	    'wsl' {
		Install-WSL
	    }
	    'choco' {
		Install-Chocolatey
	    }
	    'docker' {
		Install-Docker
	    }
	    'nvm' {
		Install-NVM
	    }
	    # 'node' {


	    # 	# This gets handled inside `Run-Dashboard`, so do nothing.
	    # 	# Install-Node
	    # }
	    default {
		choco install $cmd
	    }
	}
    }
}

function Create-Directory($path) {
    If(!(test-path $path)) {
	Msg("Creating $path directory")
	New-Item -ItemType Directory -Force -Path $path
    }
}

function Create-Directories() {
    Create-Directory($POINT_DIR)
    Create-Directory($SRC_DIR)
    Create-Directory($SOFTWARE_DIR)
    Create-Directory($LIVE_DIR)
}

function Test-DashboardRepo() {
    If(test-path $SRC_DASHBOARD_DIR) {
	return $true
    }
    return $false
}

function Test-PNRepo() {
    If(test-path $SRC_PN_DIR) {
	return $true
    }
    return $false
}

function Test-SDKRepo() {
    If(test-path $SRC_SDK_DIR) {
	return $true
    }
    return $false
}

function Test-AllRepos() {
    return (Test-SDKRepo -And Test-PNRepo -And Test-DashboardRepo)
}

function Test-AllInstalled() {
    if (Test-AllCommandsExist -And Test-AllRepos) {
	Msg("")
	Msg("Congratulations, you have all the necessary components to run PointNetwork!")
	Msg("")
	Msg("")
    } else {
	Msg("Something is wrong. Not all commands are installed. Please check the logs")
	Exit 1
    }
}

function Clone-Repository($repo) {
    # git clone $repoLocation$gitRepo $localFolder\$gitRepo
}

function Clone-Repositories() {
    if(!(Test-PNRepo)) {
	Msg("Cloning PointNetwork")
	git clone https://github.com/pointnetwork/pointnetwork $SRC_PN_DIR
    }
    if(!(Test-DashboardRepo)) {
	Msg("Cloning PointNetwork Dashboard")
	git clone https://github.com/pointnetwork/pointnetwork-dashboard $SRC_DASHBOARD_DIR
    }
    if(!(Test-SDKRepo)) {
	Msg("Cloning PointSDK")
	git clone https://github.com/pointnetwork/pointsdk $SRC_SDK_DIR
    }
}


function Update-Repositories() {
    if(Test-PNRepo) {
	Msg("Updating PointNetwork")
	git --git-dir=$SRC_PN_DIR/.git pull
    }
    if(Test-DashboardRepo) {
	Msg("Updating PointNetwork Dashboard")
	git --git-dir=$SRC_DASHBOARD_DIR/.git pull
    }
    if(Test-SDKRepo) {
	Msg("Updating PointSDK")
	git --git-dir=$SRC_SDK_DIR/.git pull
    }
}

function Copy-BrowserProfile() {
    If(!(test-path $LIVE_DIR/profile)) {
	Msg("Copying browser profile")
	Copy-Item -Path $SRC_DASHBOARD_DIR/liveprofile -Recurse -Destination $LIVE_DIR/profile -Container
    }
}

function Install-NVM() {
    Msg("Installing nvm")
    Invoke-WebRequest "https://github.com/coreybutler/nvm-windows/releases/download/1.1.8/nvm-setup.zip" -OutFile $SOFTWARE_DIR\nvm-setup.zip
    Expand-Archive -LiteralPath $SOFTWARE_DIR\nvm-setup.zip -DestinationPath $SOFTWARE_DIR
    & $SOFTWARE_DIR/nvm-setup.exe /SILENT /SUPPRESSMSGBOXES
}

function Install-WebExt() {
    $env:ChocolateyInstall = Convert-Path "$((Get-Command choco).Path)\..\.."   
    Import-Module "$env:ChocolateyInstall\helpers\chocolateyProfile.psm1"
    refreshenv
    
    npm install --global web-ext
}

function Install-Node() {
    cd $SRC_DASHBOARD_DIR
    Msg("Installing required node.js version")
    nvm install $NODE_VERSION | out-null
    Msg("Changing to required node.js version")
    nvm use | out-null
    Msg("Installing required node.js packages using npm")
    npm install | out-null
}

function Run-Dashboard() {
    Msg("Starting PointNetwork Dashboard")
    wsl --set-default ubuntu
    npm start
}

function Create-Shortcut() {
    $startScript = "$SRC_DASHBOARD_DIR\start.ps1"
    $WScriptShell = New-Object -ComObject WScript.Shell
    $shortcutLocation = "$HOME/Desktop/Point.lnk"
    $shortcut = $WScriptShell.CreateShortcut($ShortcutLocation)
    $shortcut.IconLocation="$SRC_DASHBOARD_DIR\resources\pointlogo_any_bg.ico"
    $shortcut.TargetPath = 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe'
    $shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$startScript`""
    $shortcut.Save()
}

function Set-Restarted() {
    Out-File -FilePath $RESTARTED
}


function Test-Restarted() {
    If(test-path $RESTARTED) {
	return $true
    }
    return $false
}

function Restart-PopUp() {
    if(Test-Restarted) {
	return
    }
    Add-Type -AssemblyName PresentationCore,PresentationFramework
    $msgBody = "It is necessary to *RESTART* your system. Do you want to restart now?"
    $msgTitle = "System Restart Required"
    $msgButton = "YesNo"
    $msgImage = 'Question'
    $Result = [System.Windows.MessageBox]::Show($msgBody,$msgTitle,$msgButton,$msgImage)
    if($Result -Eq "Yes") {
	Set-Restarted
	Restart-Computer
    }
}

function Set-PointOnWSL() {
    wsl --set-default ubuntu
    $windowsHome = wsl wslpath "$(wsl wslvar USERPROFILE)"
    wsl rm -rf ~/.point
    wsl mkdir -p ~/.point/keystore
    wsl mkdir -p ~/.point/src
    wsl git clone https://github.com/pointnetwork/pointnetwork ~/.point/src/pointnetwork
    # wsl printf "{}" ^> ~/.point/keystore/arweave.json
    # wsl cd ~/.point/src/pointnetwork
    # wsl ln -s "$windowsHome/.point/keystore/key.json" ~/.point/keystore/key.json
}

function Echo-Welcome {
    Msg("")
    Msg("Welcome to PointNetwork Installer")
    Msg("")
    Msg("This script creates necessary directories inside $HOME\.point,")
    Msg("installs Chocolatey, a package manager for Windows,")
    Msg("installs some commands using Chocolatey, if not already present,")
    Msg("and clones all the required PointNetwork repositories inside $HOME\.point/src.")
    Msg("")
    Msg("The commands that this script will install are:")
    Msg("")

    Msg($CMDS)
    Msg("")
}

# if (Ask "Do you want to continue?") {
#     Msg "Yes"
# } else {
#     Msg "No"
# }

Echo-Welcome
Create-Directories
Install-Commands
Clone-Repositories
Install-Node
Install-WebExt
Create-Shortcut
Copy-BrowserProfile
Update-Repositories
Restart-PopUp
Test-AllInstalled
# Create-Aliases # TODO
Set-PointOnWSL
Run-Dashboard
