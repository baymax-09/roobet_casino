import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useGameTagSelectChipStyles = makeStyles(theme =>
  createStyles({
    FormControl__Container: {
      width: '100%',
      margin: 0,
    },
    Select__Item: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 0.5,
    },
  }),
)
