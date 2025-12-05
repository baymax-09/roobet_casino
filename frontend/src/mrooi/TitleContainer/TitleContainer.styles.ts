import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useTitleContainerStyles = makeStyles(theme =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    },

    header: {
      display: 'flex',
      alignContent: 'center',
      padding: theme.spacing(4),
      borderBottom: `1px solid ${theme.palette.gray.lighter}`,
    },

    title: {
      color: theme.palette.primary.main,
      fontSize: '2rem',
      fontWeight: theme.typography.fontWeightMedium,
    },

    returnTo: {
      display: 'flex',
      padding: theme.spacing(3),
      borderBottom: `1px solid ${theme.palette.gray.lighter}`,
    },

    returnToLink: {
      fontSize: '1.5rem',
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.palette.primary.main,

      '& a': {
        color: theme.palette.primary.main,
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',

        '& .MuiSvgIcon-root': {
          marginRight: theme.spacing(1.5),
        },
      },
    },

    actions: {
      marginLeft: 'auto',
    },

    actionButton: {
      marginLeft: theme.spacing(2),
    },

    container: {
      padding: theme.spacing(4),
    },

    formContainer: {
      width: '891px',
      margin: '0 auto',
      padding: theme.spacing(4),

      '& .MuiInputBase-root': {
        marginBottom: theme.spacing(5),
      },

      '& .MuiDivider-root': {
        marginBottom: '40px',
      },
    },
  }),
)
