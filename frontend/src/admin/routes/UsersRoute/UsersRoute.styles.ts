import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useUsersRouteStyles = makeStyles(theme =>
  createStyles({
    root: {
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'none',
      height: 'auto',

      [theme.breakpoints.up('md')]: {
        maxHeight: '100%',
        height: '100vh',
      },
    },

    header: {
      flexShrink: 0,
      display: 'block',
      alignItems: 'center',
      padding: theme.spacing(1),
      borderRadius: 0,

      [theme.breakpoints.up('md')]: {
        display: 'flex',
        padding: theme.spacing(2),
      },
    },

    keyTextField: {
      flex: 1,
      marginRight: theme.spacing(2),
    },

    indexSelect: {
      marginRight: theme.spacing(2),
      minWidth: 70,
    },

    lookupForm: {
      display: 'block',
      alignItems: 'center',
      width: '100%',
      [theme.breakpoints.up('md')]: {
        display: 'flex',
      },
    },

    lookupInputs: {
      display: 'block',
      marginTop: theme.spacing(1.5),
      '& > *': {
        width: 'calc(50% - 16px)',
      },
      [theme.breakpoints.up('md')]: {
        display: 'initial',
        marginTop: 'initial',
        '& > *': {
          width: 'initial',
        },
      },
    },

    lookupButtons: {
      display: 'block',
      marginTop: theme.spacing(1.5),
      '& > *': {
        width: 'calc(50% - 8px)',
      },
      [theme.breakpoints.up('md')]: {
        display: 'initial',
        marginTop: 'initial',
        '& > *': {
          width: 'initial',
        },
      },
    },

    session: {
      position: 'relative',
      flex: 1,
      overflowY: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      padding: theme.spacing(2),
    },

    emptySession: {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      lineHeight: '24px',

      fontWeight: theme.typography.fontWeightMedium,
    },

    viewHistoryLink: {
      cursor: 'pointer',
      color: theme.palette.secondary.main,
    },

    activeView: {
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      marginTop: theme.spacing(2),
      flex: 1,
    },

    viewSwitcher: {
      margin: 0,
    },

    copyPlayerButton: {
      marginLeft: '10px',
      position: 'relative',
      bottom: '2px',
      color: theme.palette.primary.dark,
    },

    currentPlayerContainer: {
      display: 'flex',
      flexDirection: 'row',
    },

    actionsContainer: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      alignItems: 'center',

      '& > *': {
        margin: '4px 4px 4px 0',
      },
    },

    deletedUserContainer: {
      backgroundColor: theme.palette.red.main,
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'center',
      width: 'fit-content',
      borderRadius: '4px',
      padding: '10px',
      fontSize: '16px',
    },
  }),
)
