// Material UI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
// Icons
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'

const ResourceItemCard = ({
  title,
  buttonLabel,
  onClick,
  status,
  icon,
  isLoading,
  version,
}: {
  title: string
  buttonLabel: string
  onClick: any
  icon: any
  status: boolean
  isLoading: boolean
  version: string | null
}) => {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      borderRadius={2}
      sx={{ p: 2 }}
      bgcolor="primary.light"
    >
      <Box flex={3}>
        <Typography variant="h6">{title}</Typography>
        <Box display="flex" alignItems="center">
          <Typography color="text.secondary" sx={{ mr: 0.5 }}>
            Status: {status ? 'Running' : 'Stopped'}
          </Typography>
          {status ? (
            <CheckCircleIcon color="success" />
          ) : (
            <CancelIcon color="error" />
          )}
        </Box>
        <Box display="flex" alignItems="center">
          <Typography color="text.secondary" sx={{ mr: 0.5 }}>
            Version: {version}
          </Typography>
        </Box>
        <Button
          variant="contained"
          sx={{ mt: '2rem' }}
          onClick={onClick}
          disabled={isLoading}
        >
          {buttonLabel}
        </Button>
      </Box>
      <Box sx={{ opacity: status ? 1 : 0.2 }} flex={1}>
        {icon}
      </Box>
    </Box>
  )
}

export default ResourceItemCard
