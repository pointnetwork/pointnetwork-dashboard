import { GlobalStyle } from './styles/GlobalStyle'

import { Installer } from './components/Installer'
import { Firefox } from './components/Firefox'

export function App() {
  return (
    <>
      <GlobalStyle />
      <Installer />
      <Firefox />
    </>
  )
}