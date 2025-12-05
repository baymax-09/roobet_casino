import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useRoowardClaimRowStyles = makeStyles(theme =>
  createStyles({
    RoowardsDialog__rewardItem: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      position: 'relative',
      padding: theme.spacing(2),
      backgroundColor: uiTheme.palette.neutral[700],
      borderRadius: '12px',
      gap: theme.spacing(2),
    },

    RewardItem__rewardContainer: {
      display: 'flex',
      alignItems: 'flex-start',
      flex: 1,
      gap: theme.spacing(2),
    },

    RoowardsProgressIndicator: {
      display: 'flex',
      padding: theme.spacing(0.5),
      borderRadius: '8px',
      backgroundColor: uiTheme.palette.primary.main,
      backgroundImage: `linear-gradient(90deg, transparent 50%, ${uiTheme.palette.neutral[900]} 50%), linear-gradient(90deg, ${uiTheme.palette.neutral[900]} 50%, transparent 50%)`,
    },

    RoowardsImageContainer: {
      position: 'relative',
      backgroundColor: uiTheme.palette.neutral[900],
      borderRadius: '6px',
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },

    RewardIcon__levelContainer: ({
      progressHidden,
    }: {
      progressHidden?: boolean
    }) => ({
      position: 'absolute',
      top: progressHidden ? -4 : -8,
      right: progressHidden ? -4 : -8,
      zIndex: 2,
    }),

    LevelIndicator: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '50%',
      padding: uiTheme.spacing(0.5),
      outline: `3px solid ${uiTheme.palette.neutral[900]}`,
      backgroundColor: uiTheme.palette.neutral[700],
      width: '1.5rem',
      height: '1.5rem',
    },

    RewardContainer__rewardIcon: {
      width: 97,
      height: 97,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'contain',
      backgroundPosition: 'center',

      [uiTheme.breakpoints.up('md')]: {
        width: 80,
        height: 80,
      },
    },

    RewardContainer__rewardDetails: {
      width: '100%',
      padding: '0px 2px',
    },

    RewardDetails__progressContainer: {
      display: 'flex',
      padding: `${uiTheme.spacing(0.5)} ${uiTheme.spacing(
        0.5,
      )} ${uiTheme.spacing(0.5)} ${uiTheme.spacing(1.75)}`,
      gap: uiTheme.spacing(1.5),
      backgroundColor: uiTheme.palette.neutral[900],
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: '16px',
      width: '100%',
    },

    ClaimButton: {
      width: '6rem',
    },

    ClaimButton_timeText: {
      width: '7.75rem',
    },
  }),
)
