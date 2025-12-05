import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useRestrictedTemplateStyles = makeStyles(theme =>
  createStyles({
    RestrictedTemplate: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },

    RestrictedTemplate__title: {
      marginTop: theme.spacing(1.5),
    },

    RestrictedTemplate__button: {
      marginTop: theme.spacing(2),
    },
  }),
)
