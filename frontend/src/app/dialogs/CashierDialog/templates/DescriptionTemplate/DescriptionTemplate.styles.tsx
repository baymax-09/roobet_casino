import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useDescriptionTemplateStyles = makeStyles(theme =>
  createStyles({
    DescriptionTemplate: {
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
    },
  }),
)
