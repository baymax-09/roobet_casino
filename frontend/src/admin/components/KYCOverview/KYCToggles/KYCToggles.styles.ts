import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useKYCToggleStyles = makeStyles(theme =>
  createStyles({
    KYCToggles__baseToggle: {
      display: 'flex',
      alignItems: 'center',
      padding: 10,
    },
  }),
)
