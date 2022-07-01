import { ReactEventHandler } from 'react'
// MUI
import { TypographyVariant } from '@mui/material'
import Typography from '@mui/material/Typography'

const ExternalLink = ({
  children,
  variant = 'body1',
  onClick,
}: {
  children: string
  variant?: TypographyVariant
  onClick: ReactEventHandler
}) => {
  return (
    <Typography
      variant={variant}
      color="primary"
      sx={{
        textDecoration: 'underline',
        cursor: 'pointer',
        display: 'inline',
      }}
      onClick={onClick}
    >
      {children}
    </Typography>
  )
}

export default ExternalLink
