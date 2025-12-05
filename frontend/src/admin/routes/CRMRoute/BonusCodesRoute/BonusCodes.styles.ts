import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useBonusCodeStyles = makeStyles(theme =>
  createStyles({
    BonusCodeRoute__editButton: {
      margin: 6,
      marginLeft: 'auto',
    },

    BonusCodeRoute__deleteButton: {
      margin: 6,
    },
  }),
)
