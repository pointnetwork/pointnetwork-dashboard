import { IpcRequest } from '../../shared/Interfaces';


export class IpcService {
  private render: any;

  public send<T>(channel: string, request: IpcRequest): Promise<T> {
    // If the ipcRenderer is not available try to initialize it
    if (!this.render) {
      this.initializeIpcRenderer();
    }
    // If there's no responseChannel let's auto-generate it

    const responseChannel: string = request.responseChannel? request.responseChannel: `${channel}_response_${new Date().getTime()}`;

    this.render.send(channel, request);

    // This method returns a promise which will be resolved when the response has arrived.
    return new Promise(resolve => {
        this.render.once(responseChannel, (event: any, response: T | PromiseLike<T>) => resolve(response));
    });
  }

  private initializeIpcRenderer() {
    this.render = window.Main;
  }
}