import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useChipSliderStyles = makeStyles(theme =>
  createStyles({
    OuterSliderContainer: {
      display: 'grid',
    },

    SliderContainer: {
      width: '100%',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
    },

    Slides: {
      marginBottom: 0,
      marginTop: theme.spacing(1.5),
      paddingRight: theme.spacing(3),
    },

    Slide: {
      width: 'initial',
      '&:not(:last-of-type)': {
        marginRight: theme.spacing(1),
      },

      [uiTheme.breakpoints.up('lg')]: {
        '&:not(:last-of-type)': {
          marginRight: theme.spacing(1.5),
        },
      },
    },
  }),
)
