import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useCountdownStyles = makeStyles(() =>
  createStyles({
    Countdown: {
      [uiTheme.breakpoints.up('md')]: {
        position: 'relative',
        top: 'unset',
        height: 'min-content',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
      },
    },
  }),
)
