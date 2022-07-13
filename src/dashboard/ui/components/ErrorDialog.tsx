import Dialog from '@mui/material/Dialog'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

// TODO: this will come from a shared repo of `point-error-codes`
type PointErr = { code: number; name: string; text: string }
const PointErrorCodes: Record<number, PointErr> = {
  7: {
    code: 7,
    name: 'INVALID_KEYFILE',
    text: 'Keyfile does not contain the expect format/data',
  },
}

const genericError = {
  code: NaN,
  name: 'POINT_ENGINE_ERROR',
  text: 'Unable to launch Point Engine',
}

function getButtonByError(code: number) {
  if (code === 7) {
    return (
      <Button
        color="primary"
        variant="contained"
        size="small"
        onClick={window.Dashboard.logOut}
      >
        Log Out
      </Button>
    )
  }

  return null
}

function getInstructionsByError(code: number) {
  if (code === 7) {
    return (
      <Typography>
        If you have manually edited `key.json`, you may fix it and restart the
        Point Dashboard. Otherwise, click on the button below to log out and
        create a new account or import an existing one.
      </Typography>
    )
  }

  return null
}

type Props = {
  errCode: number
}

const ErrorDialog = ({ errCode }: Props) => {
  const error = PointErrorCodes[errCode] || genericError

  return (
    <Dialog open={errCode > 0}>
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          Sorry, we have run into an error.
        </Typography>

        <Box
          sx={{ backgroundColor: '#eee', border: '1px solid #ddd' }}
          my={2}
          p={2}
        >
          <Typography>
            {error.name}: {error.text}
          </Typography>
        </Box>

        {getInstructionsByError(errCode)}

        <Box display="flex" justifyContent="flex-end" mt={2}>
          {getButtonByError(errCode)}
        </Box>
      </Box>
    </Dialog>
  )
}

export default ErrorDialog
