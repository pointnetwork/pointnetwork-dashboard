# Point Network Dashboard

![Point Network](./resources/logo.svg)

*Use this application to start using Point Network's Web 3.0!*

Point Network Dashboard is a utility that handles the installation processes
required for running Point Network, as well as the execution and maintenance of
the multiple components that are part of Point Network.

[Point Network](https://github.com/pointnetwork/pointnetwork/releases/latest) is
an implementation of decentralized internet, also known as web 3.0. Learn how it
is designed to take control of your data away from nation states and
corporations and give it back to you.

## Installation

Download the [latest
release](https://github.com/pointnetwork/pointnetwork-dashboard/releases/latest)
for your platform, decompress the file and run the extracted executable.

*NOTE FOR MAC USERS:* If MacOS tells you that the dashboard cannot be opened
because it is an app from an unidentified developer, please Control-click the
application file (`point-dashboard`) and then click on Open.

## Installation for Developers

Install the dependencies:

``` bash
npm i
```

Start the dashboard:

``` bash
npm start
```

## Test GitHub Actions

To test github workflows you need to create a new branch based on 'develop' or other branch you need to test, 

### Step 1
``` bash
git checkout -b _BranchName_
```

### Step 2

Comment lines 4 and 5 on file .github/workflows/electron-builder.yml
``` bash
# tags:
#    - 'v*'
```
### Step 3
ran a normal workflow to push adding HEAD: to the name of the branch 
``` bash
git add .
git commit -m 'message'
git push origin HEAD:_BranchName_
```

### Step 4
the previous actions will create a github action execution on 'https://github.com/pointnetwork/pointnetwork-dashboard/actions':

create_release
build_on_linux
build_on_mac
build_on_win

after each build a release (windows, mac , linux) will be add it to a folder with the same tag name as your branch on
  'https://github.com/pointnetwork/pointnetwork-dashboard/tags'

### Step5

To run again you will need to delete the releases and tag folder, after that follow  step 3
## Contributing

Pull requests are always welcome 😃.
