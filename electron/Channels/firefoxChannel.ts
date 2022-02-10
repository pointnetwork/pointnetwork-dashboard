import {IpcMainEvent} from 'electron';
import {IpcChannelInterface} from "../IpcChannelInterface";
import { IpcRequest } from '../../shared/Interfaces';
import { Firefox } from '../firefox';

export class FirefoxChannel implements IpcChannelInterface {

  private firefox = new Firefox();
  public messages: string[] = [];

  getName(): string {
    return 'firefox-channel';
  }

  async handle(event: IpcMainEvent, request: IpcRequest): Promise<void> {
    if (!request.responseChannel) {
      request.responseChannel = `${this.getName()}_response`;
    }
    const firefoxInstalled = await this.firefox.isInstalled()
    if (!firefoxInstalled) {
        await this.firefox.download();
        this.messages.push('Firefox Installing');
        event.sender.send(request.responseChannel, {messages: this.messages});
    }
    await this.firefox.launch();
    this.messages.push('Firefox Launched');
    event.sender.send(request.responseChannel, {messages: this.messages});


  }
}