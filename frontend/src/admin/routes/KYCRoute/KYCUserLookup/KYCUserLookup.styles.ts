import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useKYCUserLookupStyles = makeStyles(theme =>
  createStyles({
    KYCUserLookup: {
      padding: 15,
      overflow: 'auto',
      height: 'calc(100vh - 40px)',

      [theme.breakpoints.up('sm')]: {
        height: 'calc(100vh)',
      },
    },

    KYCUserLookup__lookupText: {
      width: '100%',
      maxWidth: 250,
    },

    KYCUserLookup__lookupButton: {
      position: 'static',
      top: 10,
      marginLeft: 0,
      marginTop: 15,

      [theme.breakpoints.up('sm')]: {
        position: 'relative',
        marginLeft: 10,
        marginTop: 'inherit',
      },
    },
  }),
)
