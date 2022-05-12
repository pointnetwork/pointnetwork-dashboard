import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import { InstallationStepsEnum } from '../../@types/installation'
import { InstallationLogData } from '../reducer'
import ProgressIndicator from './ProgressIndicator'

interface Props {
  stepCategory: InstallationStepsEnum
  log: InstallationLogData
}

const TITLES = {
  [InstallationStepsEnum.DIRECTORIES]: 'Create Directories',
  [InstallationStepsEnum.CODE]: 'Fetch Source Code',
  [InstallationStepsEnum.BROWSER]: 'Install Point Browser',
  [InstallationStepsEnum.POINT_UNINSTALLER]: 'Install Point Uninstaller',
  [InstallationStepsEnum.POINT_SDK]: 'Install Point SDK',
  [InstallationStepsEnum.POINT_NODE]: 'Install Point Node',
}

export default function Logs({ stepCategory, log }: Props) {
  const theme = useTheme()

  return (
    <Box sx={{ p: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <Typography>{TITLES[stepCategory]}</Typography>
        </Grid>
        <Grid item xs={4} justifyContent="center">
          {log.progress && log.progress > 0 ? (
            <ProgressIndicator status={log.status} progress={log.progress} />
          ) : null}
        </Grid>
      </Grid>
      <Typography variant="subtitle1" color={theme.palette.text.secondary}>
        {log.message}
      </Typography>
    </Box>
  )
}
