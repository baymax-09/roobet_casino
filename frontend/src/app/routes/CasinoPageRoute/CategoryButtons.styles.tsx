import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useCategoryButtonStyles = makeStyles(() =>
  createStyles({
    CategoryButtons: {
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

    // Need to overwrite tertiary button base styles with !important
    CategoryButton: {
      padding: `${uiTheme.spacing(1)} ${uiTheme.spacing(1.5)} ${uiTheme.spacing(
        0.75,
      )}  ${uiTheme.spacing(1.5)} !important`,
      display: 'inline-block',
      textDecoration: 'none',
      whiteSpace: 'nowrap',
      textAlign: 'center',
      flexGrow: 1,
      minWidth: 'fit-content !important',
      color: `${uiTheme.palette.neutral[400]} !important`,
      backgroundColor: `${uiTheme.palette.neutral[800]} !important`,
      borderBottom: '2px solid transparent !important',

      [uiTheme.breakpoints.up('lg')]: {
        flexGrow: 1,
      },
    },

    CategoryButtons__slide: {
      minWidth: '135px',
      display: 'flex',
      flex: 1,
    },

    CategoryButton_active: {
      backgroundColor: `${uiTheme.palette.primary[500]} !important`,
      color: `${uiTheme.palette.common.white} !important`,
      borderBottom: `2px solid ${uiTheme.palette.neutral[800]} !important`,
    },

    CategoryButton__icon_hover: {
      '&:hover': {
        color: `${uiTheme.palette.common.white} !important`,
        backgroundColor: `${uiTheme.palette.neutral[700]} !important`,
      },

      '&:hover .Ui-topHalf': {
        fill: uiTheme.palette.activeIcon.bottomHalf,
        stopColor: uiTheme.palette.activeIcon.bottomHalf,
      },

      '&:hover .Ui-bottomHalf': {
        fill: uiTheme.palette.activeIcon.bottomHalf,
      },
    },

    CategoryButton__icon: {
      width: 20,
      height: 20,

      // Special case for verification icon
      '& > g > .Ui-clipPath': {
        fill: uiTheme.palette.neutral[800],
      },
    },
  }),
)
