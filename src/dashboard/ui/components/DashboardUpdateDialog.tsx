import { Dispatch, SetStateAction, useEffect, useState } from 'react'
// MUI
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import Typography from '@mui/material/Typography'
// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'

// eslint-disable-next-line no-unused-vars
enum Messages {
  _1 = 'Checking for updates',
  _2 = 'Downloading update',
  _3 = 'Update downloaded. Unpacking the updates',
  _4 = 'Applying update and restarting',
  _5 = 'Error updating the app. Will retry updating on next startup',
  _6 = 'Already up to date',
}

const DashboardUpdateDialog = ({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}) => {
  const [title, setTitle] = useState<string>(Messages._1)
  const [percent, setPercent] = useState<string>('0')

  useEffect(() => {
    window.Dashboard.on('autoupdater:up-to-date', () => {
      setTitle(Messages._6)
      setOpen(false)
    })
    window.Dashboard.on('autoupdater:error', () => {
      setTitle(Messages._5)
      setTimeout(() => {
        setOpen(false)
      }, 3000)
    })
    window.Dashboard.on('autoupdater:downloading', (percent: string) => {
      setPercent(percent)
      setTitle(`${Messages._2}...${percent}%`)
    })
    window.Dashboard.on('autoupdater:downloaded', () => setTitle(Messages._3))
    window.Dashboard.on('autoupdater:updating', () => setTitle(Messages._4))
    window.Dashboard.checkForDashboardUpdates()
  }, [])

  return (
    <Dialog open={open} fullScreen>
      <Box
        bgcolor="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100%"
        width="100%"
      >
        <Box display="flex" alignItems="center">
          {(title.includes(Messages._1) || title.includes(Messages._4)) && (
            <CircularProgress />
          )}
          {title.includes(Messages._2) && (
            <CircularProgress
              variant="determinate"
              thickness={4}
              value={Number(percent)}
            />
          )}
          {(title.includes(Messages._3) || title.includes(Messages._6)) && (
            <CheckCircleIcon color="success" fontSize="large" />
          )}
          {title.includes(Messages._5) && (
            <ErrorIcon color="error" fontSize="large" />
          )}
          <Typography ml={1.5} variant="h6">
            {title}...
          </Typography>
        </Box>
      </Box>
    </Dialog>
  )
}

export default DashboardUpdateDialog
