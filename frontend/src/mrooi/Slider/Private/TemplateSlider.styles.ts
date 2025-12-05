import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useTemplateSliderStyles = makeStyles(() =>
  createStyles({
    block: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.25)',
      height: 75,
      padding: '0 8px',
      borderRadius: 6,
      transition: 'background 250ms ease',
      '&:hover': {
        background: 'rgba(0, 0, 0, 0.45)',
      },
    },

    item: {
      maxWidth: 50,
      maxHeight: 70,

      [uiTheme.breakpoints.up('md')]: {
        maxWidth: 110,
      },
    },
  }),
)
