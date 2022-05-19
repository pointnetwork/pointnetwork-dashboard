// Material UI
import Box from '@mui/material/Box'

// Theme provider
import UIThemeProvider from '../../../../shared/UIThemeProvider'
import SettingsIcon from '@mui/icons-material/Settings'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'

export default function MenuUninstaller({
  handleClick,
  anchorEl,
  open,
  handleClose,
  uninstall,
}: {
  handleClick: any
  anchorEl: null | HTMLElement
  open: boolean
  handleClose: any
  uninstall: any
}) {
  return (
    <UIThemeProvider>
      <Box position="fixed" right={16} top={56}>
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
      </Box>
    </UIThemeProvider>
  )
}
