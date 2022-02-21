import { useEffect, useState } from 'react'
import { Box, Button, Card, CardContent, Grid, Typography } from '@mui/material'
import { FaFirefox } from 'react-icons/fa'
import { BsCheckCircleFill } from 'react-icons/bs'
import { IconContext } from 'react-icons'

export default function () {
  const [logsElement, setStatusFirefox] = useState<string>()
  const [firefoxColor, setFirefoxColor] = useState<string>('red')

  useEffect(() => {
    window.Dashboard.checkFirefox()

    window.Dashboard.on('firefox:log', (log: string) => {
      setStatusFirefox(log)
    })

    window.Dashboard.on('firefox:active', (active: boolean) => {
      const color = active ? 'green' : 'red'
      setFirefoxColor(color)
    })
  }, [])

  const openFirefox = () => {
    window.Dashboard.openFirefox()
  }

  const FirefoxStyle = {
    color: '#ededed',
    size: '70px',
  }

  const IconStyle = {
    color: firefoxColor,
    size: '25px',
    marginTop: '5px'
  }

  return (
    <Card sx={{ display: 'flex', minWidth: 350, background: '#DAE3EA' }} elevation={4}>
      <Grid container spacing={2}>
        <Grid item xs={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: '1 0 auto' }}>
              <Grid container spacing={2}>
                <Grid item xs={2}>
                <IconContext.Provider value={IconStyle}>
                  <BsCheckCircleFill/>
                  </IconContext.Provider>
                </Grid>
                <Grid item xs={10}>
                  <Typography component="div" variant="h5">
                    Firefox
                  </Typography>
                  <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  component="div"
                >
                  Firefox app status
                </Typography>
                </Grid>
              </Grid>
            </CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, pb: 1 }}>
              <Button variant="outlined" onClick={openFirefox}>
                Open Firefox
              </Button>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <IconContext.Provider value={FirefoxStyle}>
            <FaFirefox />
          </IconContext.Provider>
        </Grid>
      </Grid>
    </Card>
  )
}
