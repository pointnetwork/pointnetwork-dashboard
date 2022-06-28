import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const DisplayIdentifier = ({ identifier }: { identifier: string }) => {
  return (
    <Box position="fixed" right={8} bottom={2}>
      <Typography
        variant="caption"
        ml={1}
        sx={{ opacity: 0.7 }}
        fontFamily="monospace"
      >
        {identifier}
      </Typography>
    </Box>
  )
}

export default DisplayIdentifier
