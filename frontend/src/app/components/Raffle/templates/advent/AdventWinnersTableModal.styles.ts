import { lighten } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'

export const useAdventWinnersTableModalStyles = makeStyles(theme =>
  createStyles({
    AdventWinnersTable__header: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(3),
      background: '#141533',
    },

    Header__closeButton: {
      position: 'absolute',
      top: '5px',
      right: '5px',
      color: 'white',
    },

    Header__messsage: {
      position: 'relative',
      zIndex: 5,
    },

    Message__title: {
      fontSize: '3rem',
      lineHeight: '3rem',

      fontWeight: theme.typography.fontWeightBold,
      filter: 'drop-shadow(2px 3px 0px rgba(0, 0, 0, 0.3))',
    },

    Message__subtitle: {
      fontWeight: theme.typography.fontWeightBold,
      filter: 'drop-shadow(2px 3px 0px rgba(0, 0, 0, 0.4))',
      letterSpacing: 7,
      textTransform: 'uppercase',
      lineHeight: '1rem',
      marginTop: 2,

      '& span': {
        color: theme.palette.secondary.main,
      },
    },

    Header__animation: {
      position: 'relative',
      zIndex: 10,
      width: 80,
      height: 80,
      flexShrink: 0,
      marginRight: theme.spacing(2),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    Animation__lottie: {
      filter: 'drop-shadow(0px 5px 0px rgba(0, 0, 0, 0.3))',
    },

    Table__row: {
      position: 'relative',

      '&:nth-child(odd) .MuiTableCell-root': {
        // TODO: change this to a christmas color?
        // background: lighten(theme.palette.primary.main, 0.05)
        background: lighten(theme.palette.primary.main, 0.05),
        opacity: 0.9,
      },
      '&:nth-child(even) .MuiTableCell-root': {
        background: theme.palette.primary.main,
        opacity: 0.9,
      },
    },

    AdventWinnersTable: {
      display: 'flex',
      width: '100%',
      position: 'relative',
    },

    AdventWinnersTable__paper: {
      flex: 1,
      background: '#fff',
      position: 'relative',
    },

    TableContainer__table: {
      ...theme.typography.body2,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      position: 'relative',

      '& .MuiTableCell-root': {
        borderBottom: 'none',
        opacity: 1,
      },

      '& .MuiTableCell-head': {
        fontWeight: theme.typography.fontWeightBold,
        color: '#fff',
        fontSize: '17px',
        paddingTop: '8px',
        paddingBottom: '8px',
        background: theme.palette.primary.main,
      },

      '&:before': {
        content: '""',
        flex: 1,
        position: 'absolute',
        zIndex: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0, 0.25)',
        top: '0',
        left: '0',
      },
    },

    AdventWinnersTable__tableContainer: {
      borderRadius: '0px',

      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
  }),
)
