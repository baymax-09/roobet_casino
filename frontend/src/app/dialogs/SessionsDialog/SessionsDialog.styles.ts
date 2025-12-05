import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useSessionsDialogStyles = makeStyles(() =>
  createStyles({
    SessionDialog: {
      [uiTheme.breakpoints.up('md')]: {
        '& .MuiPaper-root': {
          maxWidth: '480px',
        },
      },
    },

    SessionDialog__content: {
      display: 'flex',
      flexDirection: 'column',
      padding: uiTheme.spacing(2),
      gap: uiTheme.spacing(1.5),
      margin: uiTheme.spacing(2),
      backgroundColor: uiTheme.palette.neutral[800],
      borderRadius: '12px',

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3.5),
        gap: uiTheme.spacing(2),
        borderRadius: 0,
        margin: 0,
      },
    },

    List: {
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '286px',
      gap: uiTheme.spacing(1),
      overflow: 'scroll',

      '&::-webkit-scrollbar': {
        display: 'none',
      },

      '@supports (scrollbar-width: none)': {
        scrollbarWidth: 'none',
      },
    },

    ListItem: {
      '&.MuiListItem-root': {
        paddingBottom: uiTheme.spacing(1.25),
        borderBottom: `2px solid ${uiTheme.palette.neutral[700]}`,
        gap: uiTheme.spacing(2),
        alignItems: 'flex-start',
        minHeight: '90px',
      },
    },

    ListItemText: {
      '&.MuiListItemText-root': {
        margin: 0,
      },
    },

    ButtonContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1),
      zIndex: 2,
      justifyContent: 'flex-end',

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(1.5),
        flexDirection: 'row',
        alignItems: 'flex-end',
      },
    },

    ButtonContainer__button: {
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        minWidth: '128px',
        width: 'fit-content',
      },
    },
  }),
)
