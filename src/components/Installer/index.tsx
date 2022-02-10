import { useEffect } from 'react';
import { IpcService } from '../../services/IpcService';

export function Installer() {

  async function handlerStart() {
    const ipc = new IpcService();
    const t = await ipc.send<{ kernel: string }>('system-info', { responseChannel: 'system-info-response'});

    console.log('Message sent! Check main process log in terminal.', t);
  }

  useEffect(() => {
    handlerStart();
  },[])

  return (
    <h1 className='text-3xl text-teal-500 font-bold'>Hello world</h1>
  )
}
 
