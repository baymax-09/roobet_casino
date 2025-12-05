import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

export const useGameCTAStyles = makeStyles(theme =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      textDecoration: 'none',

      [uiTheme.breakpoints.up('md')]: {
        '&.liveCasino-game:hover $image': {
          scale: 1.1,
        },

        '&.liveCasino-game:hover [data-image-id="dice"]': {
          rotate: '25deg',
        },

        '&.sportsbetting-game:hover $image': {
          translate: '-50px',
        },
      },
    },

    imageContainer: {
      position: 'relative',
      height: '138px',
      borderRadius: '12px',
      [uiTheme.breakpoints.up('md')]: {
        height: '216px',
      },
    },

    background: {
      width: '100%',
      height: '100%',
      borderRadius: '12px',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },

    floatingContainer: {
      position: 'absolute',
      top: 0,
      right: 0,
      [uiTheme.breakpoints.up('md')]: {
        right: 30,
      },
    },

    image: {
      transition: '.3s cubic-bezier(0.24, 0.76, 0.58, 1)',
      '&:first-child': {
        position: 'relative',
      },
      '&:not(:first-child)': {
        position: 'absolute',
      },
    },

    GameCTATextContainer: {
      display: 'flex',
      flexDirection: 'column',
      position: 'absolute',
      left: 16,
      bottom: 16,

      [uiTheme.breakpoints.up('md')]: {
        left: 24,
        bottom: 24,
      },
    },

    GameCTAText_title: {
      textShadow: ` 0px 2px 0px ${uiTheme.palette.neutral[900]}40`,
    },

    GameCTAText_subTitle: {
      textShadow: ` 0px 2px 0px ${uiTheme.palette.neutral[900]}40`,
    },
  }),
)
