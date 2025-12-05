import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

export const useDailyStatsStyles = makeStyles(theme =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      height: '100%',
      overflow: 'auto',
    },

    json: {
      height: '100%',
      width: '100%',
      overflow: 'auto',
      marginTop: theme.spacing(2),
    },
  }),
)
