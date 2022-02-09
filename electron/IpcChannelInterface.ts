import {IpcMainEvent} from 'electron';
import { IpcRequest } from '../shared/Interfaces';


export interface IpcChannelInterface {
  getName(): string;

  handle(event: IpcMainEvent, request: IpcRequest): void;
}