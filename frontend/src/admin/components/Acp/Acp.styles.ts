import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

import logomark from 'assets/images/logomark.svg'

// used to set a calc function for mobile
// set mobile nav height here and use this variable
const mobileNavHeight = '40px'

export const useAcpStyles = makeStyles(theme =>
  createStyles({
    root: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      overflow: 'auto',

      display: 'flex',
      flexDirection: 'column',

      background: theme.palette.background.default || '#f6f9fc',
    },

    appBar: {
      background: theme.palette.background.default,
      color: '#fff',
    },

    brand: {
      fontWeight: theme.typography.fontWeightBold,
    },

    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',

      [theme.breakpoints.up('md')]: {
        flexDirection: 'row',
      },
    },

    navigation: {
      display: 'none',
      flexDirection: 'column',
      overflow: 'hidden',
      width: 125,
      background: theme.palette.primary.main,
      flexShrink: 0,

      [theme.breakpoints.up('md')]: {
        display: 'flex',
      },
    },

    currentUsername: {
      padding: `${theme.spacing(2)} ${theme.spacing(1)}`,
      fontWeight: 500,
      textAlign: 'center',
      borderBottom: '2px solid rgb(255 255 255 / 5%)',
      wordWrap: 'break-word',
      color: 'white',
    },

    navigationItem: {
      color: '#fff',
      borderBottom: '1px solid rgb(255 255 255 / 5%)',
      paddingRight: '10px !important',
      paddingLeft: '10px !important',
    },

    logo: {
      backgroundImage: `url(${logomark})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      flexShrink: 0,
      width: 50,
      height: 50,
      marginRight: theme.spacing(1.5),
    },

    navigationItemTextPrimary: {
      color: '#fff',
    },

    navigationMenus: {
      flex: 1,
      overflow: 'auto',
      borderBottom: '1px solid rgb(255 255 255 / 5%)',

      '&::-webkit-scrollbar': {
        width: 0,
        height: 0,
      },
    },

    navigationFooter: {
      flexShrink: 0,
      textAlign: 'center',
      padding: theme.spacing(1),
    },

    content: {
      position: 'relative',
      flex: 1,
      overflow: 'auto',
      maxHeight: `calc(100vh - ${mobileNavHeight})`,

      [theme.breakpoints.up('md')]: {
        maxHeight: '100vh',
      },
    },

    subItems: {
      background: 'rgba(0, 0, 0, 0.3)',

      '& $navigationItem': {
        paddingLeft: theme.spacing(4),
      },
    },

    mobileMenuButtonContainer: {
      width: '100%',
      height: mobileNavHeight,
      background: theme.palette.primary.main,
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      display: 'flex',
      flex: '0',
      flexBasis: '40px',

      [theme.breakpoints.up('md')]: {
        display: 'none',
      },
    },

    navigationDrawer: {
      background: '#1c2530',
      width: '110px',
    },

    test: {
      width: '40px',
      background: 'blue',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
    },

    menuIcon: {
      color: 'white',
    },

    activeNav: {
      background: 'theme.palette.secondary.main !important',
    },
  }),
)
