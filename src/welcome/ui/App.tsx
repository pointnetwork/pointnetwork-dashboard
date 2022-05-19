import { useState } from 'react'
// MAterial UI
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import UIThemeProvider from '../../../shared/UIThemeProvider'
// Components
import SeedGenerator from './components/SeedGenerator'
import SeedConfirmation from './components/SeedConfirmation'
import Login from './components/Login'
import MenuUninstaller from './components/MenuUninstall'
import TopBar from './components/TopBar'

export default function App() {
  const [seed, setSeed] = useState<string>('')
  const [seedConfirm, setSeedConfirm] = useState<boolean>(false)
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false)

  const login = () => {
    setSeed('')
    setIsLoggingIn(true)
    setSeedConfirm(true)
  }

  const goBack = () => {
    setIsLoggingIn(false)
    setSeedConfirm(false)
  }

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleClick = (event: any) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  const uninstall = () => {
    console.log(window.Welcome)
    window.Welcome.launchUninstaller()
    handleClose()
  }

  const renderScreen = () => {
    if (!seedConfirm) {
      return (
        <SeedGenerator
          seed={seed}
          setSeed={setSeed}
          confirm={() => setSeedConfirm(true)}
          login={login}
        />
      )
    }

    if (isLoggingIn) {
      return <Login goBack={goBack} />
    }

    return <SeedConfirmation seed={seed} goBack={goBack} />
  }

  return (
    <UIThemeProvider>
      <TopBar isLoading={false} />
      <Box display="flex" alignItems="baseline">
        <Box sx={{ p: '3.5%' }}>
          <Typography variant="h4" component="h1">
            Welcome to Point Network
          </Typography>
          {renderScreen()}
        </Box>
        <MenuUninstaller
          anchorEl={anchorEl}
          handleClick={handleClick}
          open={open}
          handleClose={handleClose}
          uninstall={uninstall}
        />
      </Box>
    </UIThemeProvider>
  )
}
