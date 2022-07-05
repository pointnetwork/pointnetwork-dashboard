import { BrowserRouter, Routes, Route } from 'react-router-dom'
// Components
import TopBar from './components/TopBar'
import UIThemeProvider from '../../../shared/react-components/UIThemeProvider'
// Pages
import Home from './routes/Home'
import GenerateNew from './routes/GenerateNew'
import ImportExisting from './routes/ImportExisting'
import VerifyPhrase from './routes/VerifyPhrase'
import WelcomeRoutes from './routes/routes'

export default function App() {
  return (
    <UIThemeProvider>
      <TopBar isLoading={false} />
      <BrowserRouter>
        <Routes>
          <Route path={WelcomeRoutes.home} element={<Home />} />
          <Route path={WelcomeRoutes.new} element={<GenerateNew />} />
          <Route path={WelcomeRoutes.existing} element={<ImportExisting />} />
          <Route path={WelcomeRoutes.verify} element={<VerifyPhrase />} />
        </Routes>
      </BrowserRouter>
    </UIThemeProvider>
  )
}
