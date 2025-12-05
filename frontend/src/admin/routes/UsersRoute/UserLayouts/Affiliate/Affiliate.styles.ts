import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useAffiliateStyles = makeStyles(theme =>
  createStyles({
    root: {
      overflow: 'auto',
    },

    title: {
      marginBottom: theme.spacing(3),
    },

    sections: {
      display: 'flex',
      flexWrap: 'wrap',
    },

    // Do not remove.
    fullWidth: {},

    section: {
      width: '50%',

      '& .MuiTypography-h4': {
        marginBottom: theme.spacing(1.5),
      },

      '&$fullWidth': {
        width: '100%',
      },

      '&:not(:last-child)': {
        marginBottom: theme.spacing(3),
      },
    },

    actionButton: {
      margin: `0 ${theme.spacing(1)} ${theme.spacing(1)} 0`,
    },
  }),
)
