// Material UI
import Alert from '@mui/material/Alert'

export default function NoShareWarning() {
  return (
    <Alert severity={'warning'} sx={{ mt: '.7rem', mb: '1.2rem' }}>
      Never share this seed phrase with anyone! Write it down and keep it in a
      secure place.
    </Alert>
  )
}
