if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))  
{  
  $arguments = "& '" +$myinvocation.mycommand.definition + "'"
  Start-Process powershell -Verb runAs -ArgumentList $arguments
  Break
}

$CMDS = @('choco', 'git', 'wget', 'curl', 'wsl', 'nvm', 'node', 'docker', 'docker-compose')

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
    return $(If (Get-Command wslconfig) {$true} Else {$false})
}

function Test-AllCommandsExist() {
    foreach ($cmd in $CMDS) {
	switch ($cmd)
	{
	    'wsl' {
		return Test-WSLInstalled
	    }
	    default {
		if(-Not(Get-Command $cmd)) {
		    Write-Host("Exists $true")
		    return $false
		}
	    }
	}
	
    }
    return $true
}

function Install($cmd) {
    Msg "Installing $cmd"
    choco install $cmd --yes
}

function Install-Chocolatey() {
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

function Install-WSL() {
    wsl --install
}

function Install-Commands() {
    foreach ($cmd in $CMDS) {
	switch ($cmd)
	{
	    'wsl' {
		return Install-WSL
	    }
	    'choco' {
		return Install-Chocolatey
	    }
	    default {
		choco install $cmd
	    }
	}
    }
}

function EchoWelcome {
    Msg("")
    Msg("Welcome to PointNetwork Installer")
    Msg("")
    Msg("This script creates necessary directories inside $HOME\.point,")
    Msg("installs Chocolatey, a package manager for Windows,")
    Msg("installs some commands using Chocolatey, if not already present,")
    Msg("and clones all the required PointNetwork repositories inside $HOME\.point/src.")
    Msg("")
    Msg "The commands that this script will install are:"
    Msg("")
    Msg($CMDS)
    Msg("")
}

EchoWelcome
# Write-Host(Ask)
# Test-AllCommandsExist
# Test-WSLInstalled
# Install-Chocolatey
Install-Commands
if (Ask "Do you want to continue?") {
    Msg "Hell yeah"
} else {
    Msg "Hell no"
}
