import { FC } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import { InstallationStatus } from '../reducer'

interface Props {
  status: InstallationStatus
  progress: number
}

const GridContainer: FC = ({ children }) => (
  <Grid
    container
    direction="row"
    justifyContent="flex-start"
    alignItems="center"
  >
    {children}
  </Grid>
)

export default function ProgressIndicator({ status, progress }: Props) {
  const theme = useTheme()

  if (status === 'IN_PROGRESS') {
    return (
      <GridContainer>
        <Grid item xs={4}>
          <CircularProgress
            size={20}
            color="primary"
            variant="determinate"
            value={progress}
          />
        </Grid>
        <Grid item xs={8} justifyContent="flex-start">
          <Typography variant="subtitle1" color={theme.palette.text.secondary}>
            {progress}%
          </Typography>
        </Grid>
      </GridContainer>
    )
  }

  if (status === 'FINISHED') {
    return (
      <GridContainer>
        <Grid item xs={4}>
          <CheckCircleIcon color="primary" />
        </Grid>
      </GridContainer>
    )
  }

  return null
}
