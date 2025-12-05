import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useFairnessDialogStyles = makeStyles(() =>
  createStyles({
    fairnessModal: {
      padding: 10,

      '& p': {
        marginBottom: 15,
        fontSize: 14,
      },
    },

    changeGroup: {
      marginBottom: 15,

      '&:last-of-type': {
        marginBottom: 0,
      },

      '& div': {
        display: 'flex',

        '& input': {
          marginBottom: 0,
        },

        '& button': {
          marginLeft: 10,
          width: 100,
        },
      },
    },
  }),
)
