import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useWaysToEnterStyles = makeStyles(() =>
  createStyles({
    WaysToEnterBlocksContainer: {
      display: 'flex',
      gap: uiTheme.spacing(1.5),
      width: '100%',
      flexDirection: 'column',

      [uiTheme.breakpoints.up('lg')]: {
        flexDirection: 'row',
      },
    },

    WaysToEnterBlock: {
      display: 'flex',
      width: '100%',
      backgroundColor: uiTheme.palette.neutral[700],
      borderRadius: '12px',
      position: 'relative',
      minHeight: '160px',
      gap: uiTheme.spacing(2),
      alignItems: 'center',
      padding: `${uiTheme.spacing(2)} ${uiTheme.spacing(16)} ${uiTheme.spacing(
        2,
      )} ${uiTheme.spacing(2)}`,

      [uiTheme.breakpoints.up('md')]: {
        minHeight: '132px',

        padding: `${uiTheme.spacing(3.5)} ${uiTheme.spacing(
          21.5,
        )} ${uiTheme.spacing(3.5)} ${uiTheme.spacing(3.5)}`,
      },
    },

    WaysToEnterBlock__textContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(0.5),
    },

    WaysToEnterBlock__ticketsImage: {
      position: 'absolute',
      top: 24,
      right: -8,
      width: '7.25rem',
      height: '7.25rem',

      [uiTheme.breakpoints.up('md')]: {
        top: -10,
        width: '9.25rem',
        height: '9.25rem',
      },
    },

    Link: {
      '&:hover': {
        color: uiTheme.palette.common.white,
      },
    },
  }),
)
