import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useMultiBoxInputStyles = makeStyles(theme =>
  createStyles({
    MultiBoxInput__container: {
      display: 'flex',
      gap: theme.spacing(1.5),
      height: '56px',
    },

    BoxInput: {
      width: 'auto',
      backgroundColor: uiTheme.palette.neutral[700],
      height: '100% !important',
      color: uiTheme.palette.common.white,
      fontSize: '1.75rem !important',

      fontWeight: `${uiTheme.typography.fontWeightBold} !important`,
      lineHeight: '2.25rem !important',
      textAlign: 'center',
    },
  }),
)
