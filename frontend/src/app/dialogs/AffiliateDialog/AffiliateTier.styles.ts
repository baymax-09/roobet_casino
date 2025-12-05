import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useAffiliateTierStyles = makeStyles(theme =>
  createStyles({
    AffiliateTierProgress: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    },

    AffiliateTier__topblock: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },

    AffiliateTierInfo__container: {
      marginLeft: 'auto',
    },

    AffiliateTierInfo__icon: {
      width: 16,
      height: 16,
      cursor: 'pointer',

      '&:hover': {
        '& .Ui-fill': {
          fill: uiTheme.palette.common.white,
        },
      },
    },

    AffiliateTierCommissionProgress: {
      display: 'flex',
      flexDirection: 'column',
      marginTop: 'auto',
    },

    AffiliateTierCommissionProgress__text: {
      color: uiTheme.palette.neutral[300],
    },

    LinearProgress: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
    },

    LinearProgress_progress: {
      backgroundColor: `${uiTheme.palette.neutral[900]} !important`,
      borderRadius: 100,
    },

    AffiliateTierBottomTiers: {
      display: 'flex',
      width: '100%',
      justifyContent: 'space-between',
    },

    AffiliateTierNextTierProgress: {
      display: 'flex',
      flexDirection: 'row',
    },
  }),
)
