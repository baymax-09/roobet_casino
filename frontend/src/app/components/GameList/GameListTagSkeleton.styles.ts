import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useGameListTagSkeletonStyles = makeStyles(theme =>
  createStyles({
    GameListSkeleton: {
      padding: `0px 0px ${theme.spacing(1)}`,
      width: '100%',
      marginBottom: uiTheme.spacing(2),
    },

    GameListSkeleton__header: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    GameListSkeleton__wrapper: {
      margin: '0 auto',
      maxWidth: uiTheme.breakpoints.values.lg,
      width: '100%',
      padding: 0,
      marginTop: uiTheme.spacing(2),
      display: 'flex',
      overflow: 'auto',
      overflowX: 'hidden',
    },
  }),
)
