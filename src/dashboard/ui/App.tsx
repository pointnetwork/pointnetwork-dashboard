import { Container, Image, Text } from './styles'
import Firefox from '../../firefox/ui'

export default function App() {


  return (
    <Container>
      <Image
        src="https://pointnetwork.io/assets/imgs/logo.svg"
        alt="Point logo"
      />
      <Text>Welcome to Point Network Dashboard.</Text>
      <Firefox/>
    </Container>
  )
}
