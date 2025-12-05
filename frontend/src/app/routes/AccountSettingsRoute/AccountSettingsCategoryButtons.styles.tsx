import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useAccountSettingsCategoryButtonsStyles = makeStyles(() =>
  createStyles({
    AccountSettingsCategoryButtons: {
      display: 'flex',
      overflowX: 'scroll',
      overflowY: 'hidden',
      msOverflowStyle: 'none',
      scrollbarWidth: 'none',
      gap: uiTheme.spacing(1),

      '&::-webkit-scrollbar': {
        display: 'none',
      },

      [uiTheme.breakpoints.up('md')]: {
        overflowX: 'initial',
      },
    },

    AccountSettingsCategoryButton__icon: {
      width: 24,
      height: 24,

      // Special case for verification icon
      '& > g > .Ui-clipPath': {
        fill: uiTheme.palette.neutral[800],
      },
    },

    slide: {
      width: 'fit-content',
    },
  }),
)
