import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { type SxThemedPropsRecord } from '@project-atl/ui'

export const styles = {
  resultPaper: {
    padding: theme => theme.spacing(1, 2),
  },
  errorResult: {
    // @ts-expect-error TODO AFTER MUI5-UPGRADE
    color: theme => theme.palette.red.main,
  },
  successResult: {
    // @ts-expect-error TODO AFTER MUI5-UPGRADE
    color: theme => theme.palette.green.main,
  },
} satisfies SxThemedPropsRecord

export const useResultPopoverStyles = makeStyles(theme =>
  createStyles({
    result: {
      ...theme.typography.body2,

      fontWeight: theme.typography.fontWeightMedium,
    },
  }),
)
