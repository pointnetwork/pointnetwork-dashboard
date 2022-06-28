import { Dispatch, SetStateAction } from 'react'
// MUI
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Typography from '@mui/material/Typography'

const DisclaimerDialog = ({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}) => {
  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <Box p={2}>
        <Typography variant="h5">Use this as heading</Typography>
        <Typography>
          Lorem ipsum, dolor sit amet consectetur adipisicing elit. Aliquid,
          debitis aut et eaque quia accusantium cupiditate possimus sunt
          similique. Perferendis voluptate labore impedit unde velit
          necessitatibus quasi, quibusdam minus nemo! Lorem ipsum, dolor sit
          amet consectetur adipisicing elit. Aliquid, debitis aut et eaque quia
          accusantium cupiditate possimus sunt similique. Perferendis voluptate
          labore impedit unde velit necessitatibus quasi, quibusdam minus nemo!
          Lorem ipsum, dolor sit amet consectetur adipisicing elit. Aliquid,
          debitis aut et eaque quia accusantium cupiditate possimus sunt
          similique. Perferendis voluptate labore impedit unde velit
          necessitatibus quasi, quibusdam minus nemo! Lorem ipsum, dolor sit
          amet consectetur adipisicing elit. Aliquid, debitis aut et eaque quia
          accusantium cupiditate possimus sunt similique. Perferendis voluptate
          labore impedit unde velit necessitatibus quasi, quibusdam minus nemo!
          Lorem ipsum, dolor sit amet consectetur adipisicing elit. Aliquid,
          debitis aut et eaque quia accusantium cupiditate possimus sunt amet
          consectetur adipisicing elit. Aliquid, debitis aut et eaque quia
          accusantium cupiditate possimus sunt similique. Perferendis voluptate
          labore impedit unde velit necessitatibus quasi, quibusdam minus nemo!
        </Typography>
        <Box display="flex" justifyContent="center" mt={2}>
          <Button variant="contained" onClick={() => setOpen(false)}>
            Close
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default DisclaimerDialog
