/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
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
  downloading = 'firefox:downloading',
  downloaded = 'firefox:downloaded',
  unpack = 'firefox:unpack',
  unpacking = 'firefox:unpacking',
  unpacked = 'firefox:unpacked',
  check_for_updates = 'firefox:check_for_updates',
  get_version = 'firefox:get_version',
  launch = 'firefox:launch',
  running_status = 'firefox:running_status',
}

export enum NodeChannelsEnum {
  download = 'node:download',
  check_for_updates = 'node:check_for_updates',
  get_identity = 'node:get_identity',
  get_version = 'node:get_version',
  launch = 'node:launch',
  running_status = 'node:running_status',
  stop = 'node:stop',
}

export enum UninstallerChannelsEnum {
  launch = 'uninstaller:launch',
  launching = 'uninstaller:launching',
  running_status = 'uninstaller:running_status',
}
