import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { InstallationStepsEnum } from '../../@types/installation'
import { InstallationLogData, InstallationStatus } from '../reducer'

interface Props {
  stepCategory: InstallationStepsEnum
  log: InstallationLogData
}

const TITLES = {
  [InstallationStepsEnum.DIRECTORIES]: 'Create Directories',
  [InstallationStepsEnum.CODE]: 'Fetch Source Code',
  [InstallationStepsEnum.BROWSER]: 'Install Point Browser',
  [InstallationStepsEnum.POINT_NODE]: 'Install Point Node',
}

export default function Logs({ stepCategory, log }: Props) {
  const theme = useTheme()

  const getStatus = (status: InstallationStatus) => {
    if (status === 'IN_PROGRESS') {
      return <CircularProgress size={20} color="primary" />
    }
    if (status === 'FINISHED') {
      return <CheckCircleIcon color="primary" />
    }
    return null
  }

  return (
    <Box sx={{ p: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <Typography>{TITLES[stepCategory]}</Typography>
        </Grid>
        <Grid item xs={4} justifyContent="center">
          {getStatus(log.status)}
        </Grid>
      </Grid>
      <Typography variant="subtitle1" color={theme.palette.text.secondary}>
        {log.msg}
      </Typography>
    </Box>
  )
}
