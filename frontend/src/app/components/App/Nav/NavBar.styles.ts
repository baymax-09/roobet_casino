import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useNavBarStyles = makeStyles(theme =>
  createStyles({
    AppBar__root: {
      '&.MuiPaper-root': {
        alignItems: 'center',
      },
      [uiTheme.breakpoints.up('md')]: {
        borderRight: '0px solid transparent',
      },
    },

    AppBar__root_borderRight: {
      [uiTheme.breakpoints.up('md')]: {
        borderRight: `4px solid ${uiTheme.palette.neutral[900]}`,
      },
    },

    AppBar__root_transition: {
      '&.MuiPaper-root': {
        [uiTheme.breakpoints.up('md')]: {
          // Matches chat open/close transition.
          transition: theme.transitions.create('all', {
            easing: theme.transitions.easing.sharp,
            duration: 400,
          }),
        },
      },
    },

    AppBar__toolBar: {
      display: 'grid !important',
      justifyContent: 'space-between',
      width: '100%',
      padding: 0,
      // Account for the toolbar padding.
      maxWidth: `calc(${uiTheme.breakpoints.values.lg}px + ${uiTheme.spacing(
        6,
      )})`,

      [uiTheme.breakpoints.up('sm')]: {
        gridTemplateColumns: '1fr auto 1fr',
      },
    },

    ToolBar__contentLeft: {
      display: 'flex',
      alignItems: 'center',
      gridColumnStart: 1,
      gridColumnEnd: 2,
    },

    ToolBar__contentRight: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flex: 1,
      gridColumn: 3,
      gap: uiTheme.spacing(1),
    },

    Logo: {
      display: 'block',
      flexShrink: 0,
      height: 36,
      width: 36,
      overflow: 'hidden',

      '& > img': {
        height: '100%',
      },

      [uiTheme.breakpoints.up('md')]: {
        height: 44,
        width: 170,
      },
    },

    Logo_forceSmallLogo: {
      width: 44,
    },

    Logo_halloween: {
      height: 50,
      transition: '2s ease-in',
      '&:hover': {
        opacity: 0,
        animation: '2s ease-in-out',
      },
    },
  }),
)
