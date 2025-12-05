import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useDialogWithTabsStyles = makeStyles(theme =>
  createStyles({
    DialogWithTabs__wrapper: {
      overflowY: 'scroll',
      display: 'flex',
      flexDirection: 'column',

      // Hide scrollbar for Chrome, Safari and Opera
      '&::-webkit-scrollbar': {
        display: 'none',
      },
      // Hide scrollbar for Mozilla
      scrollbarWidth: 'none',
    },

    DialogWithTabs__wrapper_mobile: {
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: uiTheme.palette.neutral[900],
      padding: theme.spacing(2),
      overflowY: 'auto',
    },

    DialogWithTabs__content: {
      display: 'flex',
      flexDirection: 'column',

      // Hide scrollbar for Chrome, Safari and Opera
      '&::-webkit-scrollbar': {
        display: 'none',
      },
      // Hide scrollbar for Mozilla
      scrollbarWidth: 'none',

      '&.MuiDialogContent-root': {
        background: 'initial',
        overflowY: 'hidden',

        [uiTheme.breakpoints.up('md')]: {
          overflowY: 'auto',
        },
      },
    },

    DialogWithTabs__tabs: {
      // position: 'relative',

      '&.MuiTabs-root': {
        minHeight: 40,
        height: 'fit-content',
      },
    },

    DialogWithTabs__tab: {
      '&.MuiTab-root': {
        padding: `${theme.spacing(1.25)} ${theme.spacing(2)}`,
        height: 40,
        minHeight: 40,
        fontSize: '0.75rem',
        lineHeight: '1rem',
      },
    },
  }),
)
