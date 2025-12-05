import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useMessateTemplateFormStyles = makeStyles(theme =>
  createStyles({
    heroImageUpload: {
      width: '100%',
      height: '230px',
      marginBottom: theme.spacing(6),
    },
  }),
)
