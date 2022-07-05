// Material UI
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
// Components
import MainLayout from '../components/MainLayout'
// Icons
import SendIcon from '@mui/icons-material/Send'

const VerifyPhrase = () => {
  return (
    <MainLayout>
      <Typography variant="h4" mt={12} mb={2}>
        Verify Secret Phrase
      </Typography>
      <Typography mb={1}>
        Enter the word that belongs to the number in the correct order
      </Typography>
      <Grid container spacing={2} mb={4}>
        <Grid item xs={4}>
          <TextField label="Word x" />
        </Grid>
        <Grid item xs={4}>
          <TextField label="Word y" />
        </Grid>
        <Grid item xs={4}>
          <TextField label="Word z" />
        </Grid>
      </Grid>
      <Button variant="contained" size="large" endIcon={<SendIcon />}>
        Confirm and Login
      </Button>
    </MainLayout>
  )
}

export default VerifyPhrase
