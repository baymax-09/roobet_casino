import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useMultiSelectStyles = makeStyles(() =>
  createStyles({
    formControl: {
      minWidth: '250px',

      '& .MuiInputBase-input': {
        padding: '2px',
        paddingRight: '15px',
      },
    },

    select: {
      minHeight: '50px',
    },

    chips: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      marginRight: '15px',
    },

    chip: {
      margin: '5px',
    },
  }),
)
