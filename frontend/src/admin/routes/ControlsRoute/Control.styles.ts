import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useControlStyles = makeStyles(theme =>
  createStyles({
    currentBlockContainer: {
      display: 'flex',
      flexDirection: 'row',
      width: 360,
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(4),
      flexWrap: 'wrap',

      // make the button layout properly vertically on small screens
      [theme.breakpoints.up('sm')]: {
        flexWrap: 'nowrap',
        justifyContent: 'space-between',
      },
    },

    currentBlockText: {
      alignItems: 'flex-end',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: 320,
    },

    currentBlockNumber: {
      alignItems: 'flex-end',
      display: 'flex',
      marginInlineEnd: 24,

      fontWeight: theme.typography.fontWeightBold,
    },

    controlForm: {
      marginBottom: theme.spacing(4),
    },

    infoIcon: {
      marginBottom: 16,
      width: 18,
    },
    popoverText: {
      padding: 4,
      width: 200,
      wordWrap: 'normal',
    },
  }),
)
