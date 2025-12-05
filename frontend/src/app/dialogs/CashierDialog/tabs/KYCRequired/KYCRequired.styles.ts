import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useKYCRequiredStyles = makeStyles(theme =>
  createStyles({
    KYCRequired__alert: {
      margin: `-${theme.spacing(1)} -${theme.spacing(2)} ${theme.spacing(2)}`,
      borderRadius: '0',
    },

    KYCRequired__header: {
      fontWeight: 500,
    },
  }),
)
