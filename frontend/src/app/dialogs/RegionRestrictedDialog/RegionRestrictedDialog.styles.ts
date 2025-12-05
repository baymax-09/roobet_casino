import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useRegionRestrictedDialogStyles = makeStyles(theme =>
  createStyles({
    RegionRestrictedDialog: {
      [uiTheme.breakpoints.up('md')]: {
        '& .MuiPaper-root': {
          maxWidth: '854px',
        },
      },
    },

    RegionRestrictedContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1.5),
      alignItems: 'flex-start',
      zIndex: 1,
      padding: `0px ${theme.spacing(2)} ${theme.spacing(2)} ${theme.spacing(
        2,
      )}`,

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(4),
      },
    },

    RegionRestricted: {
      padding: uiTheme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        padding: 0,
      },
    },

    RegionRestricted__messageHeading: {
      textShadow: '0px 4px 0px rgba(65, 10, 155, 0.50)',
    },

    RoobetFunButton__container: {
      display: 'flex',
      width: '100%',
      padding: uiTheme.spacing(0.75),
      gap: uiTheme.spacing(0.75),
      borderRadius: 16,
      background: uiTheme.palette.primary[800],

      [uiTheme.breakpoints.up('md')]: {
        width: 'initial',
      },
    },

    RoobetFunButton__mobileContainer: {
      width: 'auto',
      margin: `0px ${theme.spacing(2)}`,
    },

    RoobetFunButton: {
      minWidth: 'fit-content',
    },
  }),
)
