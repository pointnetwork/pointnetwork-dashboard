import { useEffect, useState } from 'react'
// Components
import TopBar from './components/TopBar'
import DisplayIdentifier from '../../../shared/react-components/DisplayIdentifier'
import UIThemeProvider from '../../../shared/react-components/UIThemeProvider'
// Pages
import Home from './routes/Home'
import GenerateNew from './routes/GenerateNew'
import ImportExisting from './routes/ImportExisting'
import VerifyPhrase from './routes/VerifyPhrase'
import WelcomeRoutes from './routes/routes'
// Types
import { GenericChannelsEnum } from '../../@types/ipc_channels'

export default function App() {
  const [route, setRoute] = useState<string>(WelcomeRoutes.home)

  const [identifier, setIdentifier] = useState<string>('')

  useEffect(() => {
    window.Welcome.getIdentifier()

    window.Welcome.on(
      GenericChannelsEnum.get_identifier,
      (identifier: string) => {
        setIdentifier(identifier)
      }
    )
  }, [])

  return (
    <UIThemeProvider>
      <TopBar isLoading={false} />
      <DisplayIdentifier identifier={identifier} />
      <Home route={route} setRoute={setRoute} />
      <GenerateNew route={route} setRoute={setRoute} />
      <ImportExisting route={route} setRoute={setRoute} />
      <VerifyPhrase route={route} setRoute={setRoute} />
    </UIThemeProvider>
  )
}
