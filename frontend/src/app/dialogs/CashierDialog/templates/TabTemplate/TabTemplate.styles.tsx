import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useTabTemplateStyles = makeStyles(() =>
  createStyles({
    TabTemplate: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      gap: uiTheme.spacing(2),

      '&::-webkit-scrollbar': {
        display: 'none',
      },

      [uiTheme.breakpoints.up('md')]: {
        gap: 0,
      },
    },

    ContentContainer: {
      display: 'flex',
      flexDirection: 'column',
      padding: uiTheme.spacing(2),
      backgroundColor: uiTheme.palette.neutral[700],
      width: '100%',
      borderRadius: 12,
      gap: uiTheme.spacing(2),
      overflow: 'auto',
      height: '100%',

      '&::-webkit-scrollbar': {
        display: 'none',
      },

      [uiTheme.breakpoints.up('md')]: {
        borderRadius: 0,
        padding: uiTheme.spacing(3.5),
      },
    },

    ButtonContainer: {
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: uiTheme.palette.neutral[900],
      width: '100%',
      gap: uiTheme.spacing(1.5),

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(2),
      },
    },
  }),
)
