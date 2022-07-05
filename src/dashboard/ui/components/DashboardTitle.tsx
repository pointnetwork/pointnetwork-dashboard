import { Fragment, ReactEventHandler, useEffect, useState } from 'react'
// Material UI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import SettingsIcon from '@mui/icons-material/Settings'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
// Icons
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation'
import HelpIcon from '@mui/icons-material/Help'
// Types
import { DashboardChannelsEnum } from '../../../@types/ipc_channels'

const DashboardTitle = () => {
  const [closeDialogOpen, setCloseDialogOpen] = useState<boolean>(false)

  const [dashboardVersion, setDashboardVersion] = useState<string>('0.0.0')
  const [anchorElSettings, setAnchorElSettings] = useState<
    null | (EventTarget & Element)
  >(null)
  const [anchorElHelp, setAnchorElHelp] = useState<
    null | (EventTarget & Element)
  >(null)

  const isSettingsMenuOpen = Boolean(anchorElSettings)
  const isHelpMenuOpen = Boolean(anchorElHelp)

  const openSettingsMenu: ReactEventHandler = event => {
    setAnchorElSettings(event.currentTarget)
  }
  const closeSettingsMenu = () => {
    setAnchorElSettings(null)
  }

  const openHelpMenu: ReactEventHandler = event => {
    setAnchorElHelp(event.currentTarget)
  }
  const closeHelpMenu = () => {
    setAnchorElHelp(null)
  }

  useEffect(() => {
    window.Dashboard.getDashboardVersion()

    window.Dashboard.on(
      DashboardChannelsEnum.get_version,
      (dversion: string) => {
        setDashboardVersion(dversion)
      }
    )
  }, [])

  const handleLogout = () => {
    window.Dashboard.logOut()
    setCloseDialogOpen(false)
  }

  return (
    <Fragment>
      <Box display="flex" alignItems="baseline">
        <Typography variant="h4" component="h1">
          Point Dashboard
        </Typography>
        <Typography variant="caption" marginLeft={1}>
          v{dashboardVersion}
        </Typography>
        <Box position="fixed" right={16} top={56}>
          <Box display="flex" alignItems="center">
            <Button
              color="inherit"
              onClick={() => setCloseDialogOpen(true)}
              style={{ opacity: 0.6 }}
            >
              Log Out
            </Button>
            <IconButton onClick={openHelpMenu}>
              <HelpIcon />
            </IconButton>
            <IconButton onClick={openSettingsMenu}>
              <SettingsIcon />
            </IconButton>
            <Menu
              anchorEl={anchorElSettings}
              open={isSettingsMenuOpen}
              onClose={closeSettingsMenu}
            >
              <MenuItem onClick={window.Dashboard.launchUninstaller}>
                <CancelPresentationIcon sx={{ mr: 0.8, opacity: 0.7 }} />
                Uninstall
              </MenuItem>
            </Menu>
            <Menu
              anchorEl={anchorElHelp}
              open={isHelpMenuOpen}
              onClose={closeHelpMenu}
            >
              <MenuItem
                onClick={() =>
                  window.Dashboard.openExternalLink(
                    'https://pointnetwork.io/support'
                  )
                }
              >
                <HelpIcon sx={{ mr: 0.8, opacity: 0.7 }} />
                Help & Feedback
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Box>
      <Typography color="text.secondary">
        Manage and control Point Network components in here
      </Typography>

      <Dialog open={closeDialogOpen}>
        <Box p={3}>
          <Typography>Are you sure you want to log out?</Typography>
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button
              color="inherit"
              variant="outlined"
              size="small"
              onClick={() => setCloseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="error"
              variant="contained"
              size="small"
              sx={{ ml: 1 }}
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Fragment>
  )
}

export default DashboardTitle
