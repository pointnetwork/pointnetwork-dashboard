import { Fragment, useEffect, useState } from 'react'
// Material UI
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
// Types
import { DashboardChannelsEnum } from '../../../@types/ipc_channels'

const DashboardTitle = () => {
  const [dashboardVersion, setDashboardVersion] = useState<string>('0.0.0')

  useEffect(() => {
    window.Dashboard.getDashboardVersion()

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
      </Box>
      <Typography color="text.secondary">
        Manage and control Point Network components in here
      </Typography>
    </Fragment>
  )
}

export default DashboardTitle
