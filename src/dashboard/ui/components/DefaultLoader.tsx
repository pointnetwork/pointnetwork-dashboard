// MUI Components
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import Typography from '@mui/material/Typography'

const DefaultLoader = ({
  message,
  isOpen,
}: {
  message: string
  isOpen: boolean
}) => {
  return (
    <Dialog open={isOpen}>
      <Box display="flex" alignItems="center" p={5} pl={7} pr={8}>
        <CircularProgress size={28} thickness={5} />
        <Typography variant="h6" ml={1}>
          {message}...
        </Typography>
      </Box>
    </Dialog>
  )
}

export default DefaultLoader
