import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useSettingsRouteStyles = makeStyles(theme =>
  createStyles({
    root: {
      padding: 15,
      overflow: 'auto',
      height: 'calc(100vh - 40px)',

      [theme.breakpoints.up('sm')]: {
        height: 'calc(100vh)',
      },
    },

    bannerInput: {
      width: '100%',
      maxWidth: 250,
    },

    submitButton: {
      // the button is slightly unaligned by default
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

    actionButton: {
      marginRight: 10,
      '&:last-of-type': {
        marginRight: 0,
      },
    },

    horizontalFlex: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      marginTop: -5,

      '& > *': {
        margin: 5,
      },
    },

    toggleContainer: {
      marginTop: 25,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(145px, auto))',
      rowGap: 15,
      justifyContent: 'space-between',
    },

    section: {
      margin: '30px 0',
      '&:first-of-type': {
        marginTop: '0',
      },
    },

    switchContainer: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      margin: '0 5px',

      '&:first-of-type': {
        marginLeft: 0,
      },
      '&:last-of-type': {
        marginRight: 0,
      },
    },

    linkToggle: {
      display: 'flex',
      justifyContent: 'flex-start',
      marginTop: 10,
    },

    addLink: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
    },
  }),
)
