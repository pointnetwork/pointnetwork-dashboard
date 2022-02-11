import { BrowserWindow } from 'electron';
const path = require('path')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const fs = require('fs')

class Installer {
    private window;
    private HOME_DIR;
    private POINT_SRC_DIR;
    private DIRECTORIES;
    private REPOSITORIES;

    logger = {
        log:(...log: string[]) => {
          console.log(...log)
          this.window.webContents.send('installer:log',log);
        },
        error:(...err: any[]) => {
          console.error(...err)
          this.window.webContents.send('installer:error',err);
        }
      }

    constructor(window: BrowserWindow) {
        this.window = window;

        this.HOME_DIR = process.cwd()
        this.POINT_SRC_DIR = path.join(this.HOME_DIR, '.point', 'src')
        
        this.DIRECTORIES = [
          path.join(this.HOME_DIR, '.point', 'src', 'pointnetwork'),
          path.join(this.HOME_DIR, '.point', 'src', 'pointnetwork-dashboard'),
          path.join(this.HOME_DIR, '.point', 'software'),
          path.join(this.HOME_DIR, '.point', 'keystore'),
        ]
        
        this.REPOSITORIES = ['pointnetwork', 'pointnetwork-dashboard']
    }

    start = async() => {
      this.logger.log('Starting')
      if(await this.isInstalled()) {
        await this.upgrade()
      } else {
        await this.install()
      }
      this.logger.log('Done')
    }

    isInstalled = async () => {
      this.logger.log('Checking installation...')
      return (await Promise.all(this.DIRECTORIES.map(dir => fs.existsSync(dir)))).every(
        result => result
      )
    }

    install = async () => {
      this.logger.log('Starting installation')
    
      // Create the appropriate directories
      this.logger.log('Creating directories...')
      this.DIRECTORIES.forEach(dir => {
        try {
          this.logger.log('Creating:', dir)
          fs.mkdirSync(dir, { recursive: true })
          this.logger.log('Created:', dir)
        } catch (error) {
          this.logger.error(error)
        }
      })
      this.logger.log('Created required directories')
    
      // Clone the repos
      this.logger.log('Cloning the repositores')
      await Promise.all(this.REPOSITORIES.map(async repo => {
        const dir = path.join(this.POINT_SRC_DIR, repo)
        const url = `https://github.com/pointnetwork/${repo}`
    
        this.logger.log('Cloning', url)
        await git.clone({
          fs,
          http,
          dir,
          onProgress:(progress: { phase: any; loaded: any; total: any }) => {
            let log = `${progress.phase}: ${progress.loaded}`;
            if(progress.total) log = `${log}/${progress.total}`
            this.logger.log(log)
          },
          url,
        })
        this.logger.log('Cloned', url)
      }))
    
      // Finish
      this.logger.log('Cloned the repositores')
    }
    
    upgrade = async () => {
      this.logger.log('Already installed')
    
      // Pull the latest code
      this.logger.log('Pulling the repositories')
      await Promise.all(this.REPOSITORIES.map(async repo => {
        this.logger.log('Pulling', repo)
    
        const dir = path.join(this.POINT_SRC_DIR, repo)
        await git.pull({
          fs,
          http,
          dir,
          onProgress:(progress: { phase: any; loaded: any; total: any }) => {
            let log = `${progress.phase}: ${progress.loaded}`;
            if(progress.total) log = `${log}/${progress.total}`
            this.logger.log(log)
          },
          author: { name: 'PointNetwork', email: 'pn@pointnetwork.io' },
        })
      }))
      
      this.logger.log('Pull Complete')
    }
}

export default Installer;
