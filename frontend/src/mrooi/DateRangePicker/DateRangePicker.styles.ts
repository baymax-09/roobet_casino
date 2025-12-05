import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useDateRangePickerStyles = makeStyles(theme =>
  createStyles({
    datePickerContainer: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      marginBottom: theme.spacing(1),
      marginTop: theme.spacing(1),
    },

    datePicker: {
      '& .MuiOutlinedInput-input': {
        padding: '12px 10px',
      },

      // Massive hack, but apparently MUI cannot compensate
      // for custom padding sizes outside of the theme :(
      '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': {
        transform: 'translate(14px, 14px) scale(1)',
      },

      '&:first-of-type': {
        marginRight: '10px',
      },
    },
  }),
)
