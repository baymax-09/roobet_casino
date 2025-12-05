import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useDateTimePickerStyles = makeStyles(theme =>
  createStyles({
    root: {
      '& .MuiInputBase-input': {
        padding: '14px',
      },

      '& + $root': {
        marginLeft: theme.spacing(2),
      },
    },
  }),
)
