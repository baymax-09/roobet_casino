import { lighten } from '@mui/material'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useGameContainerStyles = makeStyles(theme =>
  createStyles({
    GameContainer: {
      borderRadius: '12px',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      transition: '.3s ease',
      width: '100%',
      maxWidth: uiTheme.breakpoints.values.lg,
      margin: '0 auto',
      overflow: 'hidden',
      [uiTheme.breakpoints.up('md')]: {
        '[data-view-mode="theatre"] &': {
          minHeight: '300px',
        },
      },
    },

    GameView: {
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '100%',

      [uiTheme.breakpoints.up('md')]: {
        aspectRatio: '16 / 9',

        '[data-view-mode="theatre"] &': {
          flexGrow: 1,
          minHeight: 0, // Makes space for the footer.
          height: 'var(--roo-game-frame-height)',
          width: 'calc(var(--roo-game-frame-height) * 16 / 9)',
        },
      },
    },

    GameHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      height: 40,
      borderRadius: '12px 12px 0 0',
      transition: '.3s ease',
      flexShrink: 0,

      [uiTheme.breakpoints.up('md')]: {
        background: '#0d0e20',
        position: 'relative',
        top: 'initial',
        left: 'initial',
        right: 'initial',
      },
    },

    GameHeader__details: {
      overflow: 'hidden',
    },

    GameHeader__title: {
      width: '100%',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    },

    GameHeader__image: {
      flexShrink: 0,
      height: 25,
      width: 25,
      borderRadius: 2,
      background: 'rgba(0, 0, 0, 0.15)',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      margin: uiTheme.spacing(0, 1.8),
    },
    GameHeader__contentRight: {
      flex: 1,
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'flex-end',
      paddingRight: uiTheme.spacing(1),
    },

    GameFooter: {
      flexShrink: 0,
      display: 'none',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: 10,
      position: 'relative',
      backgroundColor: '#0d0e20',
      height: 40,
      overflow: 'hidden',

      [uiTheme.breakpoints.up('md')]: {
        display: 'flex',
      },
    },

    GameFooter__viewModes: {
      display: 'flex',
      alignItems: 'center',
    },

    GameFooter__contentRight: {
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
    },

    GameFooter__button: {
      display: 'none',
      color: theme.palette.deprecated.text.secondary,
      marginRight: uiTheme.spacing(1),

      [uiTheme.breakpoints.up('md')]: {
        display: 'initial',
      },
    },

    GameView_fullscreen: {
      '& $GameContainer': {
        height: '100vh !important',
        width: '100vw !important',
      },
    },

    GameView_theatre: {
      padding: 0,

      '& $GameHeader': {
        height: 50,
      },

      '& $GameContainer': {
        maxWidth: '100%',
      },
    },

    Game: {
      overflow: 'hidden',
      position: 'relative',
      paddingTop: 0,
      flexGrow: 1,
      backgroundColor: lighten('#111325', 0.02),
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    },

    GameView_regular: {
      [uiTheme.breakpoints.up('md')]: {
        paddingTop: '45%',
      },
    },

    Game__sizer: {
      [uiTheme.breakpoints.up('md')]: {
        display: 'block',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 10,
        margin: '0 auto',
        height: '100%',
      },
    },

    GameFooter_activeView: {
      color: theme.palette.secondary.main,
    },

    GameHeader__balanceOverlay: {
      margin: 0,
    },
  }),
)
