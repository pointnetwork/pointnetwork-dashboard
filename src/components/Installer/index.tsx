import { IpcService } from '../../services/IpcService';
import { Button } from '../Button'
import { Container, Image, Text } from './styles'


export function Installer() {

  async function handlerStart() {
      console.log('resresrer')
    const ipc = new IpcService();
    const t = await ipc.send<{ kernel: string }>('system-info', {});

    console.log('Message sent! Check main process log in terminal.', t)
  }

  return (
    <Container>
      <Image
        src="https://pointnetwork.io/assets/imgs/logo.svg"
        alt="Point logo"
      />
      <Text>Welcome to Point Network installer. Please review the components to be installed and click "Start".</Text>
      <Button onClick={handlerStart}>Start</Button>
    </Container>
  )
}
 
