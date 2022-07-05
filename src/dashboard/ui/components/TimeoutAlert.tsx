// MUI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Typography from '@mui/material/Typography'
// Components
import ExternalLink from '../../../../shared/react-components/ExternalLink'
// Types
import { StartTimeoutState } from '../../../@types/generic'

const TimeoutAlert = ({
  startTimeout,
}: {
  startTimeout: StartTimeoutState
}) => {
  return (
    <Dialog open={startTimeout.isTimedOut}>
      <Box p={3}>
        <Typography>
          Failed to start Point Network. Please, close and reopen Point Dashboard. If the
          problem persists, contact the support team on{' '}
          <ExternalLink
            onClick={() =>
              window.Dashboard.openExternalLink(
                'https://discord.com/invite/DkH6zxCXWz'
              )
            }
          >
            Discord
          </ExternalLink>{' '}
          or{' '}
          <ExternalLink
            onClick={() =>
              window.Dashboard.openExternalLink('https://t.me/pointnetworkchat')
            }
          >
            Telegram
          </ExternalLink>
        </Typography>
        <Box display="flex" justifyContent="flex-end" mt={2}>
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
