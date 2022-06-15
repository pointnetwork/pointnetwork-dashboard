import { Fragment, ReactEventHandler, useEffect, useState } from 'react'
// Material UI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import SettingsIcon from '@mui/icons-material/Settings'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { DashboardChannelsEnum } from '../../../@types/ipc_channels'

const DashboardTitle = ({
  handleClick,
  anchorEl,
  open,
  handleClose,
  uninstall,
  updateing,
  logout,
}: {
  handleClick: any
  anchorEl: null | HTMLElement
  open: boolean
  handleClose: any
  uninstall: any
  updateing: boolean
  logout: ReactEventHandler
}) => {
  const [dashboardVersion, setDashboardVersion] = useState<string>('0.0.0')

  useEffect(() => {
    window.Dashboard.on(
      DashboardChannelsEnum.get_version,
      (dversion: string) => {
        setDashboardVersion(dversion)
      }
    )
  }, [])

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
          {!updateing && (
            <Box display="flex" alignItems="center">
              <Button onClick={logout} color="inherit" style={{ opacity: 0.6 }}>
                Log Out
              </Button>
              <IconButton onClick={handleClick}>
                <SettingsIcon />
              </IconButton>
              <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                <MenuItem onClick={uninstall}>Uninstall</MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
      </Box>
      <Typography color="text.secondary">
        Manage and control Point Network components from here
      </Typography>
    </Fragment>
  )
}

export default DashboardTitle
