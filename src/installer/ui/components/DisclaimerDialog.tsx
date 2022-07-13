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
    <Dialog open={open}>
      <Box p={2}>
        <Typography variant="h6" textAlign="center">
          Before you start...
        </Typography>
        <Typography mt={1} variant="body2" fontSize="8pt">
          1. Point Network is an uncensorable decentralized network. We just
          provide the software to you to access it, and it's up to you how to
          use it, however you shall all the time comply with our{' '}
          <Typography
            variant="caption"
            color="primary"
            sx={{ textDecoration: 'underline', cursor: 'pointer' }}
            onClick={window.Installer.openTermsAndConditions}
          >
            Terms of Use
          </Typography>
          . Whatever you upload and share is under your legal responsibility.
          Conversely, be aware that people might upload all kinds of content
          (including NSFW), so if you're less than 18, ask your
          parents/guardians for their consent. This means that they should
          clearly understand what is Point Network before allowing you to use
          it.
        </Typography>
        <Typography mt={1} variant="body2" fontSize="8pt">
          2. Everything you upload and share on Point Network goes to
          decentralized storage called Arweave, and stays there forever. Do not
          upload anything that you might regret staying online later. Also do
          not upload your personal data that you are not willing to share with
          public.
        </Typography>
        <Typography mt={1} variant="body2" fontSize="8pt">
          3. The software is in the alpha stage. It is an experimental software,
          anything can happen. Do not try to upload your most private and
          sensitive information yet, until the security audits.
        </Typography>
        <Typography mt={1} variant="body2" fontSize="8pt">
          4. In alpha, we use installation and usage logs to support our alpha
          testers (the ID in the bottom right corner is the support ID you would
          give us to assist you). In beta, it will be opt-in. In full release,
          there will be no logs.
        </Typography>
        <Typography mt={1} variant="body2" fontSize="8pt">
          5. Do not share your secret phrase with anyone, even if you think it's
          someone from the Point team. It's not. We do not need your secret
          phrase. It's your key to the web3 world, so take good care of it.
        </Typography>
        <Typography mt={2} variant="body2" fontSize="8pt">
          Happy journey!
        </Typography>
        <Box display="flex" flexDirection="column" alignItems="center" mt={3}>
          <Button variant="contained" onClick={() => setOpen(false)}>
            I undestand and agree to continue
          </Button>
          <Button
            color="inherit"
            onClick={window.Installer.closeWindow}
            sx={{ mt: 1 }}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default DisclaimerDialog
