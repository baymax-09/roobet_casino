import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useGameDialogStyles = makeStyles(() =>
  createStyles({
    GameModal: {
      padding: 10,
    },

    GameModal__gameTitle: {
      textTransform: 'capitalize',
      textAlign: 'center',
    },

    GameModal__gameID: {
      opacity: 0.5,
      textAlign: 'center',
      marginTop: 10,
    },

    GameModal__stats: {
      marginTop: 15,
      '& > p': {
        wordBreak: 'break-all',
      },
    },
  }),
)
