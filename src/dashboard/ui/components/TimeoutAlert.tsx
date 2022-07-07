import { useEffect, useState } from 'react'
// MUI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
// Components
import ExternalLink from '../../../../shared/react-components/ExternalLink'
// Icons
import CheckIcon from '@mui/icons-material/Check'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
// Types
import { StartTimeoutState } from '../../../@types/generic'
import { GenericChannelsEnum } from '../../../@types/ipc_channels'

const TimeoutAlert = ({
  identifier,
  startTimeout,
}: {
  identifier: string
  startTimeout: StartTimeoutState
}) => {
  const [copied, setCopied] = useState<boolean>(false)

  useEffect(() => {
    window.Dashboard.on(GenericChannelsEnum.copy_to_clipboard, () => {
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    })
  }, [])

  return (
    <Dialog open={startTimeout.isTimedOut}>
      <Box p={3}>
        <Typography>
          Failed to start Point Network. Please, close and reopen Point
          Dashboard. If the problem persists, contact the support team{' '}
          <ExternalLink
            onClick={() =>
              window.Dashboard.openExternalLink(
                'https://pointnetwork.io/support'
              )
            }
          >
            here
          </ExternalLink>{' '}
          with your support ID -{' '}
        </Typography>
        <Box display="flex" alignItems="center" mt={1}>
          <Chip label={identifier} sx={{ mr: 0.5 }} />
          {copied ? (
            <Box display="flex" alignItems="center">
              <IconButton>
                <CheckIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2">Copied!</Typography>
            </Box>
          ) : (
            <Box display="flex" alignItems="center">
              <IconButton
                onClick={() => window.Dashboard.copyToClipboard(identifier)}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2">Click to Copy</Typography>
            </Box>
          )}
        </Box>
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
