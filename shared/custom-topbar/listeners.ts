import { BrowserWindow } from 'electron'
export default function topbarEventListeners(
  channel: string,
  window: BrowserWindow
) {
  return [
    {
      channel: `${channel}:minimizeWindow`,
      listener() {
        window.minimize()
      },
    },
    {
      channel: `${channel}:closeWindow`,
      listener() {
        window.close()
      },
    },
  ]
}
