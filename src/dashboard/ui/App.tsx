import Firefox from '../../firefox/ui'
import Docker from '../../docker/ui'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { Container, Typography } from '@mui/material'

const theme = createTheme({
  typography: {
    fontFamily: 'Arial',
  }
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{marginTop:'5px'}}>
        <Typography variant="h4" gutterBottom component="div">
          Welcome to the Point Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" component="div">
          Manage the various point components from here
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box
              sx={{
                p: 2,
                bgcolor: 'background.default',
                display: 'grid',
                gridTemplateColumns: { md: '1fr 1fr' },
                gap: 2,
              }}
            >
              <Firefox />
              <Docker />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  )
}
