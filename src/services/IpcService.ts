import { IpcRequest } from '../../shared/Interfaces';


export class IpcService {
  private render: any;
  private response: any; 

  public async send<T>(channel: string, request: IpcRequest): Promise<T> {
    // If the ipcRenderer is not available try to initialize it
    if (!this.render) {
      this.initializeIpcRenderer();
    }
    // If there's no responseChannel let's auto-generate it

    const responseChannel: string = request.responseChannel? request.responseChannel: `${channel}_response_${new Date().getTime()}`;

    this.render.send(channel, request);
   /* this.render.receive(responseChannel, (args: T) => {
        console.log(this)
    }); */
    // This method returns a promise which will be resolved when the response has arrived.
    return new Promise(resolve => {
        this.render.receive(responseChannel, (args: T) => {
            resolve(args)
        });
    });
  }

  private initializeIpcRenderer() {
      console.log(window.Main)
    this.render = window.Main;
  }
}