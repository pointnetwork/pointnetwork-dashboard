import { autoUpdater, BrowserWindow, app } from 'electron'
import axios from 'axios'
import path from 'node:path'
import Logger from '../../shared/logger'
import { gte as semverGte, rcompare as semverCompare } from 'semver'
import { GithubRelease, GithubReleaseAsset } from './types'
import fs from 'node:fs'
import os from 'os'

export default class AutoUpdater {
  private window: BrowserWindow
  private baseUrl: string = 'https://api.github.com'
  private owner: string = 'pointnetwork'
  private repo: string = 'pointnetwork-dashboard'
  private logger: Logger
  private currentVersion: string
  private feedUrl: string
  private downloadsDirectory = global.platform.win32 ? path.join(
    app.getPath('temp'),
    app.getName(),
    'updates',
    'downloads'
  )
    : os.tmpdir()

  constructor({ window }: { window: BrowserWindow }) {
    this.window = window
    this.logger = new Logger()
    this.currentVersion = app.getVersion()
    // this.feedUrl = ''
    // if (global.platform.win32) {
    this.feedUrl = this.downloadsDirectory
    // }
    // this.feedUrl = this.downloadsDirectory
    // if (global.platform.darwin) {
    //   this.feedUrl = path.join(this.downloadsDirectory, 'feed.json')
    // }
  }

  getLatestRelease: () => Promise<GithubRelease> = () =>
    // eslint-disable-next-line no-async-promise-executor
    new Promise(async (resolve, reject) => {
      try {
        this.logger.info('[autoUpdater]:', 'Getting latest release from GitHub')
        const response = await axios.get(
          `${this.baseUrl}/repos/${this.owner}/${this.repo}/releases?per_page=100`
        )
        const releases: GithubRelease[] = response.data.filter(
          (release: GithubRelease) => !release.draft
        )

        if (releases.length === 0) {
          throw new Error('No releases found')
        }

        releases
          .map(f => f.name.replace('Release v', ''))
          .filter(f => f.match(/(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)/g))
          .sort((a, b) => semverCompare(a, b))

        const matchedRelease: GithubRelease | undefined = releases.find(
          release => !release.prerelease
        )
        if (!matchedRelease)
          throw new Error('No non-preproduction releases found')

        this.logger.info(
          '[autoUpdater]:',
          'Latest release from GitHub',
          matchedRelease.tag_name
        )
        resolve(matchedRelease)
      } catch (error: any) {
        this.logger.error('[autoUpdater]:', 'Error: ', error)
        reject(new Error(error))
      }
    })

  downloadUpdateFromRelease: (release: GithubRelease) => Promise<void> =
    release =>
      // eslint-disable-next-line no-async-promise-executor
      new Promise(async (resolve, reject) => {
        this.logger.info(
          '[autoUpdater]:',
          'Downloading the release',
          release.tag_name
        )

        try {
          let requiredFiles: string[] | RegExp[] = []
          if (global.platform.win32)
            requiredFiles = [/[^ ]*-full\.nupkg/gim, /RELEASES/]

          if (global.platform.darwin)
            requiredFiles = [/.+?MacOS.+?\.zip/gim]
          // Find the required files in the release
          this.logger.info('[autoUpdater]:', 'Checking for required files')
          const assets = requiredFiles.map(filePattern => {
            const match = release.assets.find(asset =>
              asset.name.match(filePattern)
            )
            if (!match)
              throw new Error(
                `Release is missing a required update file for current platform (${global.platform})`
              )
            else {
              this.logger.info(
                '[autoUpdater]:',
                'Required file found',
                match.name
              )
              return match
            }
          })

          // Set variables to track download progress, including calculating the total download size
          const totalSize = assets.reduce(
            (prev, asset) => (prev += asset.size),
            0
          )
          let downloaded = 0
          let lastEmitPercent = -1

          const downloadFile = (asset: GithubReleaseAsset) => {
            // eslint-disable-next-line no-async-promise-executor
            return new Promise(async (resolve, reject) => {
              this.logger.info(
                '[autoUpdater]:',
                'Starting to download asset',
                asset.name
              )

              const outputPath = path.join(this.downloadsDirectory, asset.name)
              const assetUrl = `${this.baseUrl}/repos/${this.owner}/${this.repo}/releases/assets/${asset.id}`

              this.logger.info(
                '[autoUpdater]:',
                `Trying to download resource ${assetUrl}`
              )

              const { data } = await axios.get(asset.browser_download_url, {
                headers: {
                  Accept: 'application/octet-stream',
                },
                responseType: 'stream',
              })

              const writer = fs.createWriteStream(outputPath)

              // Emit a progress event when a chunk is downloaded
              data.on('data', (chunk: Buffer) => {
                downloaded += chunk.length
                const percent = Math.round((downloaded * 100) / totalSize)

                if (percent > lastEmitPercent) {
                  this.logger.info(
                    '[autoUpdater]:',
                    'Downloading asset',
                    asset.name,
                    percent.toString(),
                    '%'
                  )
                  this.window.webContents.send(
                    'autoupdater:downloading',
                    percent
                  )
                  lastEmitPercent = percent
                }
              })

              // Pipe data into a writer to save it to the disk rather than keeping it in memory
              data.pipe(writer)

              data.on('end', () => {
                this.logger.info(
                  '[autoUpdater]:',
                  'Downloaded asset',
                  release.name
                )
                writer.end()
              })
              writer.on('finish', () => {
                resolve(true)
              })
            })
          }

          for await (const asset of assets) {
            await downloadFile(asset)
          }

          this.window.webContents.send('autoupdater:downloaded')
          resolve()
        } catch (error: any) {
          this.logger.error('[autoUpdater]:', 'Error: ', error)
          reject(new Error(error))
        }
      })

  checkForUpdates = () =>
    new Promise(
      // eslint-disable-next-line no-async-promise-executor
      async (resolve, reject) => {
        try {
          this.logger.info('[autoUpdater]:', 'Checking for updates')
          const latestRelease = await this.getLatestRelease()
          const latestVersion = latestRelease.tag_name

          if (semverGte(this.currentVersion, latestVersion)) {
            this.logger.info('[autoUpdater]:', 'Already upto date')
            return this.window.webContents.send('autoupdater:up-to-date')
          } else {
            if (global.platform.linux)
              resolve(this.window.webContents.send('autoupdater:linux-update'))

            await this.downloadUpdateFromRelease(latestRelease)
            autoUpdater.setFeedURL({ url: this.feedUrl })
            // autoUpdater.setFeedURL({ url: 'https://github.com/pointnetwork/pointnetwork-dashboard/releases/download/v0.2.33' })
            this.logger.info(
              `[autoUpdater]: Calling electron autoUpdater's checkForUpdates()`
            )
            autoUpdater.checkForUpdates()

            autoUpdater.on('update-downloaded', () => {
              this.logger.info(
                `[autoUpdater]: Electron autoUpdater's "update-downloaded" event. Calling electron autoUpdater's quitAndInstall()`
              )
              this.window.webContents.send('autoupdater:updating')
              autoUpdater.quitAndInstall()
            })
            autoUpdater.on('before-quit-for-update', () => {
              this.logger.info(
                `[autoUpdater]: Electron autoUpdater's "before-quit-for-update" event. Called electron autoUpdater's quitAndInstall()`
              )
            })
            autoUpdater.on('error', error => {
              this.logger.info(
                `[autoUpdater]: Electron autoUpdater's "error" event.`
              )
              throw error
            })

            autoUpdater.on('checking-for-update', () => {
              this.logger.info(
                `[autoUpdater]: Electron autoUpdater's "checking-for-update" event.`
              )
            })
            autoUpdater.on('update-available', () => {
              this.logger.info(
                `[autoUpdater]: Electron autoUpdater's "update-available" event.`
              )
            })
            autoUpdater.on('update-not-available', () => {
              this.logger.info(
                `[autoUpdater]: Electron autoUpdater's "update-not-available" event.`
              )
            })
          }
          resolve(0)
        } catch (error: any) {
          this.window.webContents.send('autoupdater:error')
          this.logger.error('[autoUpdater]: Error', error)
          reject(new Error(error))
        }
      }
    )
}
