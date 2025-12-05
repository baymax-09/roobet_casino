import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

interface BlockTemplateStyles {
  padding?: string
}

export const useBlockTemplateStyles = makeStyles(theme =>
  createStyles({
    BlockTemplate: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: 'fit-content',
    },

    ContentContainer: ({ padding }: BlockTemplateStyles) => ({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(2),
      padding: padding ?? theme.spacing(2),
      backgroundColor: uiTheme.palette.neutral[800],
      width: '100%',
      height: '100%',
      borderRadius: 12,
    }),
  }),
)
