// MUI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Typography from '@mui/material/Typography'
// Components
import ContactSupport from './ContactSupport'

const TimeoutAlert = ({
  identifier,
  launchAttempts,
}: {
  identifier: string
  launchAttempts: number
}) => {
  return (
    <Dialog open={launchAttempts >= 10}>
      <Box p={3}>
        <Typography>
          Failed to start Point Network. Please, close and reopen Point
          Dashboard.
        </Typography>
        <ContactSupport identifier={identifier} />
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button
            color="error"
            variant="outlined"
            size="small"
            onClick={window.Dashboard.launchUninstaller}
          >
            Uninstall
          </Button>
          <Button
            color="error"
            variant="contained"
            size="small"
            sx={{ ml: 1 }}
            onClick={window.Dashboard.closeWindow}
          >
            Close
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default TimeoutAlert
