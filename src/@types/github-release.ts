export type GithubRelease = {
  id: number
  url: string
  tag_name: string // eslint-disable-line camelcase
  name: string
  assets: Array<{
    id: number
    name: string
    browser_download_url: string // eslint-disable-line camelcase
  }>
}
