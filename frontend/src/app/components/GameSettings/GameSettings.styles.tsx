import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useGameSettingsStyles = makeStyles(() =>
  createStyles({
    GameSettings: {
      marginTop: 10,
    },

    GameSettings__buttonContainer: {
      display: 'flex',
      flexWrap: 'wrap',

      '& > *': {
        marginLeft: 5,

        '&:first-of-type': {
          marginLeft: 0,
        },
      },
    },
  }),
)
