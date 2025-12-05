import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useVIPFAQsStyles = makeStyles(
  () =>
    createStyles({
      FAQ: {
        display: 'flex',
        flexDirection: 'column',
        gap: uiTheme.spacing(1.5),

        [uiTheme.breakpoints.up('lg')]: {
          gap: uiTheme.spacing(2),
        },
      },

      FAQAccordions: {
        display: 'flex',
        flexDirection: 'column',
        gap: uiTheme.spacing(0.25),
      },

      FAQAccordionsDetails: {
        display: 'flex',
        flexDirection: 'column',
        gap: uiTheme.spacing(2),
      },
    }),
  {
    name: 'FAQ',
  },
)
