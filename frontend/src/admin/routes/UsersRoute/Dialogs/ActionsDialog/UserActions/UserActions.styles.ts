import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useUserActionsStyles = makeStyles(theme =>
  createStyles({
    root: {
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column',

      '& p': {
        marginTop: theme.spacing(1),
      },
    },

    link: {
      color: '#2196f3',
    },

    container: {
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column',
    },

    verifyButtonGroup: {
      background: '#496584',
      '&:hover': {
        background: '#3a516b',
      },
    },

    quickActionButtonGroup: {
      background: '#1481A1',
      color: 'white',
      '&:hover': {
        background: '#106781',
      },
    },

    deleteAccountButtonGroup: {
      background: '#E21800',
      color: 'white',
      '&:hover': {
        background: '#C81007',
      },
    },

    dialogForm: {
      width: '100%',
    },
  }),
)
