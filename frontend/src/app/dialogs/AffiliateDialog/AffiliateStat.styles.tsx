import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

interface AffiliateStatStylesProps {
  rowOrColumn?: 'row' | 'column'
}

export const useAffiliateStatStyles = makeStyles(theme =>
  createStyles({
    AffiliateStat: ({ rowOrColumn = 'column' }: AffiliateStatStylesProps) => ({
      display: 'flex',
      flexDirection: rowOrColumn,
      flexGrow: 1,
      backgroundColor: uiTheme.palette.neutral[700],
      gap: theme.spacing(1),
      padding: theme.spacing(1.5),
      borderRadius: 10,
    }),

    AffiliateStatBlock: {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      alignItems: 'flex-start',
      padding: theme.spacing(1.5),
      gap: theme.spacing(0.5),
      backgroundColor: uiTheme.palette.neutral[800],
      borderRadius: 12,
    },

    AffiliateStatHeaderBlock: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },

    AffiliateStatBlock__stat: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
    },

    AffiliateStatBlock__statClaim: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  }),
)
