import { Fragment, useEffect, useState } from 'react'
// Material UI
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import SettingsIcon from '@mui/icons-material/Settings'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

const DashboardTitle = ({
  handleClick,
  anchorEl,
  open,
  handleClose,
  uninstall,
  updateing,
}: {
  handleClick: any
  anchorEl: null | HTMLElement
  open: boolean
  handleClose: any
  uninstall: any
  updateing: boolean
}) => {
  const [dashboardVersion, setDashboardVersion] = useState<string>('0.0.0')

  useEffect(() => {
    window.Dashboard.on('node:getDashboardVersion', (dversion: string) => {
      setDashboardVersion(dversion)
    })
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
            <>
              <SettingsIcon
                onClick={handleClick}
                sx={{ cursor: 'pointer' }}
              ></SettingsIcon>
              <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
              >
                <MenuItem onClick={uninstall}>Uninstall</MenuItem>
              </Menu>
            </>
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
