import { IpcService } from '../../services/IpcService';
import { useEffect } from 'react';

const Firefox = () => {

  const ipc = new IpcService();

  useEffect(() => {
    const fetchData = async () => {
      const firefoxMessage = await ipc.send<{ message: string[] }>('firefox-channel', { responseChannel: 'system-info-response'});
      console.log(firefoxMessage);
    }
    fetchData().catch(console.error);
  }, [])

  return (
      <></>
  )
}

export default Firefox;
 


