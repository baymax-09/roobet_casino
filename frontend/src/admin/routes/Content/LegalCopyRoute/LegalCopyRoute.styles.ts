import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useLegalCopyRouteStyles = makeStyles(theme =>
  createStyles({
    root: {
      padding: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      height: '100%',
      width: '100%',
    },

    title: {
      ...theme.typography.h5,
      marginBottom: '16px',
    },

    header: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      borderBottom: `solid 1px ${theme.palette.gray.light}`,
      width: '100%',
      paddingBottom: '16px',
    },

    domain: {
      marginLeft: '5px',
    },

    docForm: {
      width: '100%',
      padding: `${theme.spacing(1)} 0`,

      '& > *': {
        margin: `0 0 ${theme.spacing(2)}`,
      },
    },

    input: {
      display: 'block',
      width: '350px',

      '& label + .MuiInput-formControl': {
        width: '100%',
      },
    },

    save: {
      maxWidth: '75px',
    },
  }),
)
