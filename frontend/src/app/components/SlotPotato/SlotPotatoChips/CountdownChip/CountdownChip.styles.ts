import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useCountdownChipStyles = makeStyles(theme =>
  createStyles({
    CountdownChip: {
      width: 128,
    },

    ChildrenContainer: {
      display: 'flex',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backdropFilter: 'blur(10px)',
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }),
)
