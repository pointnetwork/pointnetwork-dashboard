import { MouseEventHandler } from 'react'
import Firefox from './components/FirefoxStatus'
import PointNode from './components/NodeStatus'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { Button, Container, Typography } from '@mui/material'

const theme = createTheme({
  typography: {
    fontFamily: 'Arial',
  },
})

const logout: MouseEventHandler = () => {
  window.Dashboard.logOut()
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="md" sx={{ marginTop: '5px' }}>
        <Grid container spacing={2}>
          <Grid item xs={10}>
            <Typography variant="h4" gutterBottom component="div">
              Welcome to the Node Dashboard
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Button variant="outlined" onClick={logout}>
              Logout
            </Button>
          </Grid>
        </Grid>
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
              <PointNode />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  )
}
