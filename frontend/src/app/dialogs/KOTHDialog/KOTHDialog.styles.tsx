import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useKOTHDialogStyles = makeStyles(() =>
  createStyles({
    KOTHDialog: {
      [uiTheme.breakpoints.up('md')]: {
        '& .MuiPaper-root': {
          maxWidth: '512px',
        },
      },
    },

    KOTHDialogContent: {
      display: 'flex',
      flexDirection: 'column',
      margin: uiTheme.spacing(2),
      padding: uiTheme.spacing(2),
      gap: uiTheme.spacing(3),
      backgroundColor: uiTheme.palette.neutral[800],
      borderRadius: '12px',

      [uiTheme.breakpoints.up('md')]: {
        margin: 0,
        padding: uiTheme.spacing(3.5),
      },
    },

    ContentContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1),
    },
  }),
)
