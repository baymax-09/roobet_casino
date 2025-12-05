import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useGlobalSearchStyles = makeStyles(theme =>
  createStyles({
    GlobalSearch: {
      width: '100%',
      height: `calc(100dvh - ${uiTheme.shape.bottomNavigationHeight}px)`,
      position: 'fixed',
      zIndex: 10,
      top: 0,
      left: 0,
      right: 0,
      visibility: 'hidden',
      opacity: 0,
      transition: 'visibility 0.2s, opacity 0.2s',
      pointerEvents: 'none',
      overflow: 'hidden',
      background: `${uiTheme.palette.neutral[900]}F2`,

      [uiTheme.breakpoints.up('md')]: {
        height: '100dvh',
      },
    },

    GlobalSearch_open: {
      visibility: 'visible',
      opacity: 1,
      pointerEvents: 'auto',
    },

    GlobalSearch_mobile: {
      background: uiTheme.palette.neutral[900],
    },

    GlobalSearch__searchResult: {
      height: '100%',
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: theme.spacing(2),
      gap: theme.spacing(2),
      alignItems: 'center',
      paddingBottom: 0,
      width: '100%',
      maxWidth: uiTheme.breakpoints.values.lg,
      margin: '0 auto',

      [uiTheme.breakpoints.up('md')]: {
        gap: theme.spacing(3),
        padding: theme.spacing(3),
        paddingBottom: 0,
      },
    },

    GlobalSearch__content: {
      display: 'contents',
    },

    GameListViewContainer: {
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      paddingBottom: uiTheme.spacing(2),
      scrollbarWidth: 'none',

      '&::-webkit-scrollbar': {
        display: 'none',
      },

      [uiTheme.breakpoints.up('md')]: {
        paddingBottom: uiTheme.spacing(3),
      },
    },
  }),
)
