import { useNavigate } from 'react-router-dom'
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

const Home = () => {
  return (
    <Container maxWidth="sm">
      <Typography variant="h4" mt={16}>
        Enjoy the next generation of Internet
      </Typography>
      <Box width="560px">
        <Grid container pt={2.5}>
          <ClickableCard
            route={WelcomeRoutes.new}
            icon={<KeyIcon sx={{ height: 64, width: 64 }} />}
          >
            Generate New Secret Phrase
          </ClickableCard>
          <ClickableCard
            route={WelcomeRoutes.existing}
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
  route,
}: {
  icon: any
  children: string
  route: string
}) => {
  const navigate = useNavigate()

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
        onClick={() => navigate(route)}
      >
        {icon}
        <Typography variant="h6" textAlign="center" mt={1} lineHeight={1.5}>
          {children}
        </Typography>
      </Box>
    </Grid>
  )
}
