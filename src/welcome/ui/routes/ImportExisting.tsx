// Material UI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
// Components
import MainLayout from '../components/MainLayout'
// Icons
import SendIcon from '@mui/icons-material/Send'

const ImportExisting = () => {
  return (
    <MainLayout>
      <Grid container mt={3.5} mb={1.5}>
        <Grid item xs={10}>
          <Typography variant="h4" mb={3}>
            Import Existing Key
          </Typography>
          <Typography>Please enter your secret phrase</Typography>
        </Grid>
        <Grid item xs={2}>
          <Button variant="outlined" sx={{ ml: 5 }}>
            Paste
          </Button>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <TextField label="1" />
        </Grid>
        <Grid item xs={3}>
          <TextField label="2" />
        </Grid>
        <Grid item xs={3}>
          <TextField label="3" />
        </Grid>
        <Grid item xs={3}>
          <TextField label="4" />
        </Grid>
        <Grid item xs={3}>
          <TextField label="5" />
        </Grid>
        <Grid item xs={3}>
          <TextField label="6" />
        </Grid>
        <Grid item xs={3}>
          <TextField label="7" />
        </Grid>
        <Grid item xs={3}>
          <TextField label="8" />
        </Grid>
        <Grid item xs={3}>
          <TextField label="9" />
        </Grid>
        <Grid item xs={3}>
          <TextField label="10" />
        </Grid>
        <Grid item xs={3}>
          <TextField label="11" />
        </Grid>
        <Grid item xs={3}>
          <TextField label="12" />
        </Grid>
      </Grid>
      <Box mt={4}>
        <Button
          variant="contained"
          size="large"
          disabled
          endIcon={<SendIcon />}
        >
          Confirm & Login
        </Button>
      </Box>
    </MainLayout>
  )
}

export default ImportExisting
