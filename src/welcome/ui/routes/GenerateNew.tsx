import { useNavigate } from 'react-router-dom'
import WelcomeRoutes from './routes'
// Material UI
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
// Components
import MainLayout from '../components/MainLayout'
// Icons
import SendIcon from '@mui/icons-material/Send'

const GenerateNew = () => {
  const navigate = useNavigate()

  return (
    <MainLayout>
      <Typography variant="h4" mt={3} mb={2}>
        Generate Secret Phrase
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={7}>
          <Box border="2px dashed #ccc" borderRadius={3} px={2.5} py={1.5}>
            <Grid container>
              <Grid item xs={6} py={1.5}>
                <Typography>1.</Typography>
              </Grid>
              <Grid item xs={6} py={1.5}>
                <Typography>2.</Typography>
              </Grid>
              <Grid item xs={6} py={1.5}>
                <Typography>3.</Typography>
              </Grid>
              <Grid item xs={6} py={1.5}>
                <Typography>4.</Typography>
              </Grid>
              <Grid item xs={6} py={1.5}>
                <Typography>5.</Typography>
              </Grid>
              <Grid item xs={6} py={1.5}>
                <Typography>6.</Typography>
              </Grid>
              <Grid item xs={6} py={1.5}>
                <Typography>7.</Typography>
              </Grid>
              <Grid item xs={6} py={1.5}>
                <Typography>8.</Typography>
              </Grid>
              <Grid item xs={6} py={1.5}>
                <Typography>9.</Typography>
              </Grid>
              <Grid item xs={6} py={1.5}>
                <Typography>10.</Typography>
              </Grid>
              <Grid item xs={6} py={1.5}>
                <Typography>11.</Typography>
              </Grid>
              <Grid item xs={6} py={1.5}>
                <Typography>12.</Typography>
              </Grid>
            </Grid>
          </Box>
        </Grid>
        <Grid item xs={5}>
          <Alert severity="info">
            <AlertTitle>
              <Typography fontWeight="bold">IMPORTANT</Typography>
            </AlertTitle>
            <Typography mt={-0.7} variant="body2">
              Never share your seedphrase with anyone! Write down and keep it in
              a secure place
            </Typography>
          </Alert>
          <Box mt={1.5} mb={6.5}>
            <Typography mb={1.5}>
              Click "Generate" to generate a new secret phrase
            </Typography>
            <Button variant="contained" sx={{ mr: 1.5 }}>
              Generate
            </Button>
            <Button variant="outlined">Copy</Button>
          </Box>
          <Button
            variant="contained"
            size="large"
            endIcon={<SendIcon />}
            fullWidth
            onClick={() => navigate(WelcomeRoutes.verify)}
            // disabled
          >
            Continue
          </Button>
        </Grid>
      </Grid>
    </MainLayout>
  )
}

export default GenerateNew
