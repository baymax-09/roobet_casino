import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useRecentlyPlayedStyles = makeStyles(() =>
  createStyles({
    RecentlyPlayedContainer: {
      padding: `0px ${uiTheme.spacing(2)}  ${uiTheme.spacing(
        2,
      )}  ${uiTheme.spacing(2)}`,

      [uiTheme.breakpoints.up('md')]: {
        padding: `0px ${uiTheme.spacing(3)}  ${uiTheme.spacing(
          3,
        )}  ${uiTheme.spacing(3)}`,
      },
    },

    RecentlyPlayed: {
      margin: '0 auto',
      maxWidth: uiTheme.breakpoints.values.lg,
    },
  }),
)
