import { useEffect, useState } from 'react'
import { IconContext } from 'react-icons'
import { Box, Button, Card, CardContent, Grid, Typography } from '@mui/material'
import { BsCheckCircleFill } from 'react-icons/bs'
import PointShadow from '../../../public/pointIcon'

export default function () {
  const [activeDocker, setActiveDocker] = useState<string>()

  useEffect(() => {
    window.Dashboard.checkDocker()
    
    window.Dashboard.on('pointNode:checked', (active: boolean) => {
      const color = active ? 'green' : 'red'
      setActiveDocker(color)
    })
  }, [])

  const checkNode = () => {
    window.Dashboard.checkNode()
  }


  const IconStyle = {
    color: activeDocker,
    size: '25px',
    marginTop: '5px',
  }

  return (
    <Card
      sx={{ display: 'flex', minWidth: 350, background: '#DAE3EA' }}
      elevation={4}
    >
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: '1 0 auto' }}>
              <Grid container spacing={2}>
                <Grid item xs={2}>
                  <IconContext.Provider value={IconStyle}>
                    <BsCheckCircleFill />
                  </IconContext.Provider>
                </Grid>
                <Grid item xs={10}>
                  <Typography component="div" variant="h5">
                    Point
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    component="div"
                  >
                    Point Node status
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, pb: 1 }}>
              <Button variant="outlined" onClick={checkNode}>
                Check Status
              </Button>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={4}>
          
            <PointShadow />

        </Grid>
      </Grid>
    </Card>
  )
}
