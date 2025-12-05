import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useFreePlayDialogStyles = makeStyles(theme =>
  createStyles({
    FreePlayDialog: {
      [uiTheme.breakpoints.up('md')]: {
        '& .MuiPaper-root': {
          maxWidth: '616px',
        },
      },
    },

    content: {
      padding: 0,
    },

    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      backgroundColor: uiTheme.palette.neutral[700],
      padding: uiTheme.spacing(3.5),

      [uiTheme.breakpoints.down('md')]: {
        padding: uiTheme.spacing(2),
      },
    },

    paper: {
      width: '100%',
      overflow: 'hidden',
      [uiTheme.breakpoints.up('md')]: {
        borderRadius: uiTheme.shape.borderRadius,
      },
    },

    blurred: {
      pointerEvents: 'none',
    },

    actions: {
      display: 'flex',
      paddingBottom: uiTheme.spacing(2),
      justifyContent: 'flex-end',
      alignItems: 'flex-start',
      gap: uiTheme.spacing(1.5),
      alignSelf: 'stretch',
    },

    actionContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: uiTheme.spacing(0.5),
      flex: '1 0 0',
    },

    surveyTitle: {
      color: uiTheme.palette.common.white,

      fontWeight: `${uiTheme.typography.fontWeightBold} !important`,
    },

    link: {
      background: `${uiTheme.palette.neutral[600]} !important`,
      display: 'flex',
      padding: `${theme.spacing(1.375)} 0px ${theme.spacing(1.625)} 0px`,
      justifyContent: 'center',
      alignItems: 'center',
      gap: uiTheme.spacing(1.25),
      borderRadius: 12,
      minWidth: 'unset',
      '&:hover': {
        // @ts-expect-error fix me, update neutral color
        background: `${uiTheme.palette.neutral.main}80 !important`,
      },
      [uiTheme.breakpoints.down('md')]: {
        display: 'none !important',
      },
    },

    redirectIcon: {
      width: '16px',
      height: '16px',
    },

    iconContainer: {
      display: 'flex',
      padding: `0px ${theme.spacing(1.5)}`,
      justifyContent: 'center',
      alignItems: 'center',
      gap: uiTheme.spacing(0.5),
    },

    frame: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 490,
      width: '100%',
    },
  }),
)
