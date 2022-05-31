import { Fragment, ReactEventHandler } from 'react'
// MUI Components
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

const balanceStyle = {
  fontWeight: 'bold',
  fontSize: '18px',
}

const link = {
  fontWeight: 'bold',
  color: '#401E84',
}

const monospace = {
  fontFamily: 'ui-monospace',
  fontSize: '14px',
  fontStyle: 'normal',
  fontVariant: 'normal',
  fontWeight: '700',
  lineHeight: '26.4px',
  color: '##D3D3D3',
}

const WalletInfo = ({
  isLoading,
  isLoadingWalletInfo,
  walletInfo,
  identity,
  requestYPoints,
  logout,
  isNodeUpdating,
  isFirefoxUpdating,
  isSdkUpdating,
}: {
  isLoading: boolean
  isLoadingWalletInfo: boolean
  walletInfo: {
    address: string
    balance: string
  }
  identity: string | null
  requestYPoints: ReactEventHandler
  logout: ReactEventHandler
  isNodeUpdating: boolean
  isFirefoxUpdating: boolean
  isSdkUpdating: boolean
}) => {
  if (isLoading || isNodeUpdating || isFirefoxUpdating || isSdkUpdating)
    return null

  return (
    <Grid
      container
      p="1rem"
      pt=".75rem"
      my=".65rem"
      borderRadius={2}
      border={'2px dashed'}
      borderColor="primary.light"
    >
      <Grid item xs={12} marginBottom={1}>
        {!isLoadingWalletInfo && Number(walletInfo.balance) <= 0 && (
          <Alert severity="info">
            You need POINT token to interact with the network. Click “Request yPOINTs” to get some testnet tokens.
          </Alert>
        )}
      </Grid>
      <Grid item xs={11}>
        {identity ? (
          <Typography variant="h6" component="h2" marginBottom={'2px'}>
            You are logged in as <span style={balanceStyle}>@{identity}</span>
          </Typography>
        ) : (
          <Typography variant="h6" component="h2" marginBottom={'2px'}>
            No identity yet, register one when the browser opens
          </Typography>
        )}
      </Grid>
      {isLoadingWalletInfo ? (
        <Grid item xs={12} display="flex" marginY={2}>
          <CircularProgress size={20} />
          <Typography ml=".6rem">Getting Wallet Info...</Typography>
        </Grid>
      ) : (
        <Fragment>
          <Grid item xs={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Wallet Address
            </Typography>
          </Grid>
          <Grid item xs={8}>
            <Typography variant="subtitle2">
              {walletInfo.address ? (
                <span style={monospace}>{walletInfo.address}</span>
              ) : (
                'N/A'
              )}
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Balance
            </Typography>
          </Grid>
          <Grid item xs={8} marginBottom={2}>
            <Typography variant="subtitle2">
              {walletInfo.balance ? (
                <>
                  <span style={balanceStyle}>{walletInfo.balance}</span> yPOINT
                </>
              ) : (
                'N/A'
              )}
            </Typography>
          </Grid>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              disabled={Number(walletInfo.balance) > 0}
              onClick={requestYPoints}
            >
              Request yPOINTs
            </Button>
            <Button
              variant="contained"
              onClick={logout}
              style={{ marginRight: '5px' }}
            >
              Logout
            </Button>
          </Stack>
        </Fragment>
      )}
    </Grid>
  )
}

export default WalletInfo
