/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
export enum InstallerChannelsEnum {
  start = 'install:start',
  error = 'install:error',
  create_dirs = 'install:create_dirs',
  clone_repos = 'install:clone_repos',
  open_terms_link = 'install:open_terms_link',
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
  check_for_updates = 'generic:check_for_updates',
  get_identifier = 'generic:get_identifier',
  minimize_window = 'generic:minimize_window',
  open_external_link = 'generic:open_external_link',
}

export enum DashboardChannelsEnum {
  check_balance_and_airdrop = 'dashboard:check_balance_and_airdrop',
  closing = 'dashboard:closing',
  get_version = 'dashboard:get_version',
  check_for_updates = 'dashboard:check_for_updates',
  log_out = 'dashboard:log_out',
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

export enum BountyChannelsEnum {
  send_generated = 'bounty:send_generated',
}
