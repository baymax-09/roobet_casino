import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useHomepageRouteStyles = makeStyles(() =>
  createStyles({
    root: {
      padding: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3),
      },
    },

    container: {
      width: '100%',
      maxWidth: uiTheme.breakpoints.values.lg,
      margin: '0 auto',
    },

    KOTHBanner: {
      marginBottom: uiTheme.spacing(3),
    },

    games: {
      display: 'grid',
      gridTemplateColumns: '100%',
      gap: uiTheme.spacing(2),
      gridAutoFlow: 'row dense',

      [uiTheme.breakpoints.up('lg')]: {
        gridTemplateColumns: 'repeat(2, 1fr)',
      },
    },

    firstGames: {
      marginBottom: uiTheme.spacing(3),
    },
  }),
)
