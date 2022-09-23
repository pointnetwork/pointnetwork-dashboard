/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */

export enum InstallerChannelsEnum {
  start = 'install:start',
  error = 'install:error',
  create_dirs = 'install:create_dirs',
  clone_repos = 'install:clone_repos',
  open_terms_link = 'install:open_terms_link',
  disk_error = 'install:disk_space_error',
}

export enum WelcomeChannelsEnum {
  copy_mnemonic = 'welcome:copy_mnemonic',
  generate_mnemonic = 'welcome:generate_mnemonic',
  get_mnemonic = 'welcome:get_mnemonic',
  get_dictionary = 'welcome:get_dictionary',
  login = 'welcome:login',
  paste_mnemonic = 'welcome:paste_mnemonic',
  pick_words = 'welcome:pick_words',
  validate_mnemonic = 'welcome:validate_mnemonic',
  validate_words = 'welcome:validate_words',
}

export enum GenericChannelsEnum {
  close_window = 'generic:close_window',
  check_for_updates = 'generic:check_for_updates',
  copy_to_clipboard = 'generic:copy_to_clipboard',
  get_identifier = 'generic:get_identifier',
  minimize_window = 'generic:minimize_window',
  open_external_link = 'generic:open_external_link',
}

export enum DashboardChannelsEnum {
  check_balance = 'dashboard:check_balance',
  check_balance_and_airdrop = 'dashboard:check_balance_and_airdrop',
  closing = 'dashboard:closing',
  get_version = 'dashboard:get_version',
  check_for_updates = 'dashboard:check_for_updates',
  log_out = 'dashboard:log_out',
  check_shell_and_path = 'dashboard:check_shell_and_path',
  set_point_path = 'dashboard:set_point_path',
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
  error = 'node:error',
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
  get_version = 'sdk:get_version',
}

export enum BountyChannelsEnum {
  send_generated = 'bounty:send_generated',
}

export type DownloadChannels =
    | NodeChannelsEnum.download
    | PointSDKChannelsEnum.download
    | FirefoxChannelsEnum.download
    | PointSDKChannelsEnum.download
    | UninstallerChannelsEnum.download
    | undefined;
