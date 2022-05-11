# Changelog

This document presents a series of descriptions for the changes that
have happened and that will happen to this project (Point Network
Dashboard).

# Unreleased

# Released

## [0.2.17]

### Added

- Improved the UI/UX of the dashboard.
- Corrected the branding of the dashboard: added our logos and changed the
    color palette.
- The dashboard now presents to the user a more friendly interface when
    installing the multiple components of the dashboard.
- The dashboard automatically updates all of its components to their latest
    versions.
- Whenever an update process is taking place, Point Dashboard lets the user
    know by displaying a message and a progress bar.
- Whenever a new version of Point Dashboard is released, the user gets a
    notification asking them to update their application, along with a link
    where they can download the latest version.
- The installation progress window now shows progress bars to let the user
    know the progress of the downloads and installations of the multiple
    components.
- Point Dashboard can now be easily uninstalled by clicking on a menu item
    located at the top right corner of the dashboard window.
- Added a seed phrase generation component to help the user generate new Point
    accounts.
- The seed phrase generation component provides a tool to aid the user
    validate that they are storing their seed phrases correctly.
- Point Dashboard automatically airdrops yPOINT to alpha users when they
    create a new account.
- Point Dashboard shows the user's wallet information: their address, their
    identity and their balance.
- The main dashboard window shows the installed versions of its components:
    Point Node, Point Browser and Point Dashboard.
- The user can now logout by clicking on a button. This action erases the
    user's private key from their computer to promote the user's privacy.
- Point Browser now requests the user's permission whenever a transaction will
    take place.
- PointSDK's UI has been improved to match our company's branding.
    

## [0.2.0]
### Added
- The addition of a [changelog](https://keepachangelog.com/en/1.0.0/)
  (this document).
- Release cycle with [semantic
  versioning](https://semver.org/spec/v2.0.0.html).
- Installers for a more user-friendly installation process.
- Github Actions for automatically checking if PRs are correctly
  indented or not.
### Changed
- The project now is written mostly in Typescript and React.
- Different UI to match the current branding.
- Improved user experience.
  - Better dependency installation processes.
  - Show error and status logs.
### Deprecated
- Usage `install-debian.sh` and `insntall-windows.bat` scripts for the
  installation process.

## [0.1.0] - 2022-01-08

[0.2.0]: https://github.com/pointnetwork/pointnetwork-dashboard/compare/0.1.0...0.2.0
[0.1.0]: https://github.com/pointnetwork/pointnetwork-dashboard/releases/tag/0.1.0
