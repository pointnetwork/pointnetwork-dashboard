/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
export enum InstallerChannelsEnum {
  create_dirs = 'install:create_dirs',
  clone_repos = 'install:clone_repos',
}

export enum WelcomeChannelsEnum {
  copy_mnemonic = 'welcome:generate_mnemonic',
  generate_mnemonic = 'welcome:generate_mnemonic',
  get_dictionary = 'welcome:get_dictionary',
  login = 'welcome:login',
  paste_mnemonic = 'welcome:paste_mnemonic',
  validate_mnemonic = 'welcome:validate_mnemonic',
}

export enum GenericChannelsEnum {
  close_window = 'generic:close_window',
  get_identifier = 'generic:get_identifier',
  minimize_window = 'generic:minimize_window',
}

export enum DashboardChannelsEnum {
  closing = 'dashboard:closing',
  get_version = 'dashboard:get_version',
  log_out = 'dashboard:log_out',
  open_download_link = 'dashboard:open_download_link',
}

export enum FirefoxChannelsEnum {
  download = 'firefox:download',
  check_for_updates = 'firefox:check_for_updates',
  get_version = 'firefox:get_version',
  launch = 'firefox:launch',
  running_status = 'firefox:running_status',
  unpack = 'firefox:unpack',
  stop = 'firefox:stop',
}

export enum NodeChannelsEnum {
  download = 'node:download',
  check_for_updates = 'node:check_for_updates',
  get_identity = 'node:get_identity',
  get_version = 'node:get_version',
  launch = 'node:launch',
  running_status = 'node:running_status',
  stop = 'node:stop',
  unpack = 'node:unpack',
}

export enum UninstallerChannelsEnum {
  download = 'uninstaller:download',
  launch = 'uninstaller:launch',
  running_status = 'uninstaller:running_status',
  unpack = 'uninstaller:unpack',
}

export enum PointSDKChannelsEnum {
  download = 'pointsdk:download',
  check_for_updates = 'pointsdk:check_for_updates',
}
