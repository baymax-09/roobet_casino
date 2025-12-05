import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useContainerStyles = makeStyles(() =>
  createStyles({
    container: {
      width: '100%',
      maxWidth: uiTheme.breakpoints.values.lg,
      margin: `0 auto`,
    },
  }),
)
