import { api } from '../main/bridge'

declare global {
  // eslint-disable-next-line
  interface Window {
    Main: typeof api
  }
}
