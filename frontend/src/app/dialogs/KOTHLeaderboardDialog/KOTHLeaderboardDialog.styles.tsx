import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useKOTHLeaderboardDialogStyles = makeStyles(theme =>
  createStyles({
    KothLeaderboard: {
      borderRadius: '12px',
      padding: theme.spacing(2),

      [uiTheme.breakpoints.up('md')]: {
        padding: 0,
      },
    },

    KothLeaderboard__hidden: {
      display: 'flex',
      alignItems: 'center',
      gap: uiTheme.spacing(1),
    },

    KothLeaderboard__game__image: {
      height: '32px',
      minWidth: '32px',
      width: '32px',
      borderRadius: '8px',
      marginRight: uiTheme.spacing(1),
      position: 'relative',
      overflow: 'hidden',

      '&:after': {
        display: 'none',
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        border: `2px solid ${uiTheme.palette.common.white}`,
        borderRadius: '8px',
      },

      '&:hover:after': {
        display: 'block',
      },
    },

    KothLeaderboard__game: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'inherit',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },

    KothLeaderboard__game__link: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      textDecoration: 'none',
      overflow: 'hidden',
      color: uiTheme.palette.common.white,
      width: '100%',
    },

    KothLeaderboard__game__name: {
      textTransform: 'capitalize',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '145px',
    },

    DrawingOfWinnersContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: uiTheme.spacing(0.75),
    },

    CalendarContainer: {
      position: 'relative',
      width: 'fit-content',
      height: '24px',
    },

    CalendarContainer__monthText: {
      position: 'absolute',
      top: '55%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },

    DrawingOfWinnersContainer__textContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: uiTheme.spacing(0.25),
    },
  }),
)
