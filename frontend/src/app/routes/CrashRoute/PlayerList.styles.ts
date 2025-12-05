import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const usePlayerListStyles = makeStyles(theme =>
  createStyles({
    root: {
      position: 'relative',
      height: 200,
      overflow: 'hidden',

      [uiTheme.breakpoints.up('md')]: {
        flex: 1,
        height: 'initial',
      },
    },
  }),
)
