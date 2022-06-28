import { Fragment, useEffect, useState } from 'react'
// MUI Components
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
// Types
import { IdentityLog } from '../../../@types/generic'
import {
  DashboardChannelsEnum,
  NodeChannelsEnum,
} from '../../../@types/ipc_channels'

const balanceStyle = {
  fontWeight: 'bold',
  fontSize: '18px',
}

const monospace = {
  fontFamily: 'monospace',
  fontSize: '14px',
  fontStyle: 'normal',
  fontVariant: 'normal',
  fontWeight: '700',
  lineHeight: '26.4px',
}

const WalletInfo = ({ isNodeRunning }: { isNodeRunning: boolean }) => {
  const [identityInfo, setIdentityInfo] = useState<IdentityLog>({
    identity: '',
    isFetching: true,
    address: '',
    log: '',
  })
  const [balance, setBalance] = useState<number | string>(0)

  useEffect(() => {
    window.Dashboard.on(NodeChannelsEnum.get_identity, (_: string) => {
      const parsed: IdentityLog = JSON.parse(_)
      setIdentityInfo(parsed)
    })

    window.Dashboard.on(
      DashboardChannelsEnum.check_balance_and_airdrop,
      (_: string) => {
        setBalance(_)
      }
    )
  }, [])

  useEffect(() => {
    if (isNodeRunning) {
      window.Dashboard.getIdentityInfo()
      window.Dashboard.sendGeneratedEventToBounty()
      window.Dashboard.checkBalanceAndAirdrop()
    }
  }, [isNodeRunning])

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
      {identityInfo.isFetching ? (
        <Grid item xs={12} display="flex" marginY={2}>
          <CircularProgress size={20} />
          <Typography ml=".6rem">Getting Wallet Info...</Typography>
        </Grid>
      ) : (
        <Fragment>
          <Grid item xs={12}>
            {identityInfo.identity ? (
              <Typography variant="h6" component="h2" marginBottom={'2px'}>
                You are logged in as{' '}
                <span style={balanceStyle}>@{identityInfo.identity}</span>
              </Typography>
            ) : (
              <Typography variant="h6" component="h2" marginBottom={'2px'}>
                No identity yet, register one when the browser opens
              </Typography>
            )}
          </Grid>
          <Grid item xs={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Wallet Address
            </Typography>
          </Grid>
          <Grid item xs={8}>
            <Typography variant="subtitle2">
              {identityInfo.address ? (
                <span style={monospace}>{identityInfo.address}</span>
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
              {balance ? (
                <>
                  <span style={balanceStyle}>{balance}</span> yPOINT
                </>
              ) : (
                'N/A'
              )}
            </Typography>
          </Grid>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              disabled={Number(balance) > 0}
              onClick={window.Dashboard.checkBalanceAndAirdrop}
            >
              Request yPOINTs
            </Button>
          </Stack>
        </Fragment>
      )}
    </Grid>
  )
}

export default WalletInfo
