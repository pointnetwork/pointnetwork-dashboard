import {IpcMainEvent} from 'electron';
import {IpcChannelInterface} from "../IpcChannelInterface";
import {execSync} from "child_process";
import { IpcRequest } from '../../shared/Interfaces';

export class SystemInfoChannel implements IpcChannelInterface {
  getName(): string {
    return 'system-info';
  }

  handle(event: IpcMainEvent, request: IpcRequest): void {
    if (!request.responseChannel) {
      request.responseChannel = `${this.getName()}_response`;
    }
    event.sender.send(request.responseChannel, { kernel: execSync('uname -a').toString() });
  }
}