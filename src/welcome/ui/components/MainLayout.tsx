import { ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
// MUI
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const MainLayout = ({
  children,
}: {
  children: ReactElement | ReactElement[]
}) => {
  const navigate = useNavigate()

  return (
    <Box>
      <Box pl={2}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
      </Box>
      <Container maxWidth="md">
        <Box px={10}>{children}</Box>
      </Container>
    </Box>
  )
}

export default MainLayout
