import { IpcService } from '../../services/IpcService';
import { Button } from '../Button'
import { Container } from './styles'


export function Firefox() {

  async function handlerStart() {
    const ipc = new IpcService();
    const t = await ipc.send<{ kernel: string }>('firefox-channel', { responseChannel: 'system-info-response'});

    console.log('Message sent! Check main process log in terminal.', t);
  }

  return (
    <Container>
      <Button onClick={handlerStart}>Firefox</Button>
    </Container>
  )
}
 
