import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

interface StatBlockStylesProps {
  rowOrColumn?: 'row' | 'column'
}

export const useStatBlockStyles = makeStyles(theme =>
  createStyles({
    StatBlock: ({ rowOrColumn = 'column' }: StatBlockStylesProps) => ({
      display: 'flex',
      flexDirection: rowOrColumn,
      backgroundColor: uiTheme.palette.neutral[700],
      gap: theme.spacing(1),
      padding: theme.spacing(1.5),
      borderRadius: '12px',
      flexWrap: 'wrap',
    }),

    StatBlock_title: {
      fontSize: '14px',
      lineHeight: '20px',

      fontWeight: uiTheme.typography.fontWeightBold,
      width: '100%',
    },

    StatBlockBlock: {
      display: 'flex',
      flexDirection: 'column',
      flexGrow: 1,
      alignItems: 'flex-start',
      padding: theme.spacing(1.5),
      gap: theme.spacing(0.5),
      backgroundColor: uiTheme.palette.neutral[800],
      borderRadius: '12px',
    },

    StatBlockHeaderBlock: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },

    StatBlockBlock__stat: {
      fontWeight: uiTheme.typography.fontWeightMedium,
      fontSize: '22px',
      lineHeight: '28px',
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
    },
  }),
)
