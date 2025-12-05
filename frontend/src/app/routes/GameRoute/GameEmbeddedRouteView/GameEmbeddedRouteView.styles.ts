import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useNativeGameStyles = makeStyles(theme => ({
  EmbeddedGameRoute__Container: () => ({
    position: 'relative',
    margin: '0px',

    [uiTheme.breakpoints.up('md')]: {
      height: 'auto',
      margin: '0px auto',
      padding: 0,
    },
  }),
}))
