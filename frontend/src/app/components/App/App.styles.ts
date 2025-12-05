import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import { sizing } from 'common/theme'

interface FixPosition {
  fixPosition: boolean
}

// Time in milliseconds.
export const CHAT_TRANSITION_TIME = 400

export const useAppStyles = makeStyles(theme =>
  createStyles({
    App: {
      display: 'flex',
      position: 'relative',
      flex: 1,
      zIndex: 1,
      backgroundColor: uiTheme.palette.neutral[800],
    },

    // Do not remove.
    App_chatHidden: {},

    App__chatWrapper: {
      width: '100%',
      display: 'flex',
      position: 'fixed',
      top: '0px',
      height: `calc(100dvh - ${uiTheme.shape.bottomNavigationHeight}px - 4px)`, // The bottom border of the BottomNavigation.
      right: '0px',
      left: '0px',
      zIndex: 1299,

      [uiTheme.breakpoints.up('md')]: {
        bottom: 0,
        height: 'auto',
        width: `${sizing.chat.width.lg}px`,
        left: 'auto',
        transition: theme.transitions.create('all', {
          easing: theme.transitions.easing.sharp,
          duration: CHAT_TRANSITION_TIME,
        }),
        zIndex: 'initial',
        top: uiTheme.shape.toolbarHeight.desktop,
      },

      [uiTheme.breakpoints.up('lg')]: {
        top: '0px',
      },

      [uiTheme.breakpoints.up('xl')]: {
        width: `${sizing.chat.width.xl}px`,
      },

      '$App_chatHidden &': {
        width: '0px',
      },
    },

    App__contentContainer: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      height: `calc(100dvh - (${uiTheme.shape.toolbarHeight.mobile}px + ${uiTheme.shape.bottomNavigationHeight}px))`,
      borderRadius: '12px',
      width: '100%',
      marginTop: `${uiTheme.shape.toolbarHeight.mobile}px`,
      marginBottom: uiTheme.shape.bottomNavigationHeight,
      backgroundColor: uiTheme.palette.neutral[800],

      [uiTheme.breakpoints.up('md')]: {
        marginTop: `${uiTheme.shape.toolbarHeight.desktop}px`,
        marginBottom: 0,
        borderRadius: 0,
        height: `calc(100dvh - ${uiTheme.shape.toolbarHeight.desktop}px)`,
      },
    },

    App__pageContainer: {
      maxWidth: '100%',
      flexGrow: 1,
      zIndex: 1,
      backgroundColor: uiTheme.palette.neutral[900],
      borderTopLeftRadius: 12,
      overflow: 'scroll',
      height: '100%',
      overscrollBehavior: 'contain',

      '&::-webkit-scrollbar': {
        display: 'none',
      },

      position: ({ fixPosition }: FixPosition) =>
        fixPosition ? 'fixed' : 'relative',

      // Matches chat open/close transition.
      transition: theme.transitions.create('max-width', {
        easing: theme.transitions.easing.sharp,
        duration: CHAT_TRANSITION_TIME,
      }),

      '$App_chatHidden &': {
        maxWidth: '100%',
      },

      // Gives appearance of giving a black stroke to the AppBar
      [uiTheme.breakpoints.up('md')]: {
        borderTop: `4px solid ${uiTheme.palette.neutral[900]}`,
        maxWidth: `calc(100% - ${sizing.chat.width.lg}px)`,
      },

      [uiTheme.breakpoints.up('xl')]: {
        maxWidth: `calc(100% - ${sizing.chat.width.xl}px)`,
      },
    },

    App__openChat: {
      position: 'absolute',
      right: 0,
      bottom: 70,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',

      [uiTheme.breakpoints.up('md')]: {
        top: 'initial',
        bottom: 46,
        right: `${sizing.chat.width.lg}px`,

        // Matches chat open/close transition.
        transition: theme.transitions.create('all', {
          easing: theme.transitions.easing.sharp,
          duration: CHAT_TRANSITION_TIME,
        }),
      },

      [uiTheme.breakpoints.up('xl')]: {
        right: `${sizing.chat.width.xl}px`,
      },

      '& > *': {
        marginRight: uiTheme.spacing(2),

        '&:last-child': {
          marginRight: 0,
        },
      },

      '$App_chatHidden &': {
        right: 0,
      },
    },
  }),
)
