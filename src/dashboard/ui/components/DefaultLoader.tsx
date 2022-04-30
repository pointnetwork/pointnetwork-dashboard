// MUI Components
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

const DefaultLoader = ({
  message,
  isLoading,
}: {
  message: string
  isLoading: boolean
}) => {
  if (!isLoading) return null

  return (
    <Box display="flex" mt="1.2rem">
      <CircularProgress size={20} />
      <Typography ml=".6rem">{message}...</Typography>
    </Box>
  )
}

export default DefaultLoader
