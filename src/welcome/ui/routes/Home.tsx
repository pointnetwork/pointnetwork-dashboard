import { Dispatch, ReactEventHandler, SetStateAction } from 'react'
import WelcomeRoutes from './routes'
// Material UI
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import deepPurple from '@mui/material/colors/deepPurple'
// Icons
import DownloadIcon from '@mui/icons-material/Download'
import KeyIcon from '@mui/icons-material/Key'

const Home = ({
  route,
  setRoute,
}: {
  route: string
  setRoute: Dispatch<SetStateAction<string>>
}) => {
  if (route !== WelcomeRoutes.home) return null

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" mt={16}>
        Enjoy the next generation of Internet
      </Typography>
      <Box width="560px">
        <Grid container pt={2.5}>
          <ClickableCard
            setRoute={() => setRoute(WelcomeRoutes.new)}
            icon={<KeyIcon sx={{ height: 64, width: 64 }} />}
          >
            Generate New Secret Phrase
          </ClickableCard>
          <ClickableCard
            setRoute={() => setRoute(WelcomeRoutes.existing)}
            icon={<DownloadIcon sx={{ height: 64, width: 64 }} />}
          >
            Import an Existing Secret Phrase
          </ClickableCard>
        </Grid>
      </Box>
    </Container>
  )
}

export default Home

const ClickableCard = ({
  icon,
  children,
  setRoute,
}: {
  icon: any
  children: string
  setRoute: ReactEventHandler
}) => {
  return (
    <Grid item xs={6} p={1}>
      <Box
        border={3}
        borderRadius={3}
        p={3}
        borderColor="#ddd"
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        sx={{
          transition: 'all .2s',
          cursor: 'pointer',
          '&:hover': {
            color: ' white',
            background: deepPurple.A200,
            borderColor: deepPurple.A700,
          },
          '&:active': {
            color: ' white',
            background: deepPurple.A700,
          },
        }}
        onClick={setRoute}
      >
        {icon}
        <Typography variant="h6" textAlign="center" mt={1} lineHeight={1.5}>
          {children}
        </Typography>
      </Box>
    </Grid>
  )
}
