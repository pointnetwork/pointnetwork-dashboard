// MUI Components
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

const UpdateProgress = ({
  isLoading,
  isNodeUpdating,
  isFirefoxUpdating,
  isSdkUpdating,
  nodeUpdateProgess,
  firefoxUpdateProgess,
}: {
  isLoading: boolean
  isNodeUpdating: boolean
  isFirefoxUpdating: boolean
  isSdkUpdating: boolean
  nodeUpdateProgess: number
  firefoxUpdateProgess: number
}) => {
  if (isLoading) return null

  if (isNodeUpdating || isFirefoxUpdating || isSdkUpdating)
    return (
      <Box display="flex" mt="2rem">
        <CircularProgress
          size={20}
          thickness={4.2}
          value={isNodeUpdating ? nodeUpdateProgess : firefoxUpdateProgess}
          variant="determinate"
        />
        <Typography ml=".6rem">
          {`${isNodeUpdating ? 'Point Node' : 'Firefox'} updating... ${
            isNodeUpdating ? nodeUpdateProgess : firefoxUpdateProgess
          }%`}
        </Typography>
      </Box>
    )

  return null
}

export default UpdateProgress
