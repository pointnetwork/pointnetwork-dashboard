import { Typography, Card, CardContent, Grid } from '@mui/material'
import { GoAlert } from 'react-icons/go'

export default function CardAlert() {
  return (
    <Card
      variant="outlined"
      sx={{
        minWidth: 550,
        border: '2px solid #BBC8D4',
        background: '#DAE3EA',
      }}
    >
      <CardContent>
        <Grid container spacing={0}>
          <Grid item xs={2}>
            <GoAlert />
          </Grid>
          <Grid item xs={10}>
            <Typography variant="subtitle1" gutterBottom component="div">
              Never share this seed phrase with anyone! Write it down and keep
              it in a secure place.
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
