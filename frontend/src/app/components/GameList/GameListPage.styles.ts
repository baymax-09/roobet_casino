import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import { env } from 'common/constants'

export const useGameListPageStyles = makeStyles(() =>
  createStyles({
    GameListPage__container: {
      width: '100%',
      maxWidth: uiTheme.breakpoints.values.lg,
      margin: '0 auto',
    },

    GameListPage: {
      display: 'flex',
      flexDirection: 'column',
      padding: uiTheme.spacing(2),
      gap: uiTheme.spacing(1.5),

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3),
        gap: uiTheme.spacing(2),
      },
    },

    Header__container: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      maxWidth: uiTheme.breakpoints.values.lg,
      margin: '0 auto',
      gap: uiTheme.spacing(1),

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(2),
      },
    },

    Header__text: {
      display: 'flex',
      alignItems: 'center',

      ...(env.SEASONAL === 'true' && {
        fontFamily: "'Black And White Picture' !important",
      }),
    },

    GameListPage__kothContainer: {
      width: '100%',
      marginBottom: -uiTheme.spacing(3),
    },

    GameListPage__liveCasinoCategoriesContainer: {
      margin: '0 auto',
      maxWidth: 1110,
      width: '100%',
    },
  }),
)
