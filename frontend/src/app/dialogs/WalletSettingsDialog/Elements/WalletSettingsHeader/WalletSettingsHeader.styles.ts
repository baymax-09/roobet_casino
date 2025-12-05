import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useWalletSettingsHeaderStyles = makeStyles(theme =>
  createStyles({
    WalletSettingsHeader: {
      display: 'flex',
      flexDirection: 'column',
      maxWidth: 448,
    },
  }),
)
