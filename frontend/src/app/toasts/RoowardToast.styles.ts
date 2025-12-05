import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'

import monthLevelOne from 'assets/images/rewards/m/level_1.png'
import logoPattern from 'assets/images/logo_pattern.png'
import { getCachedSrc } from 'common/util'

export const useRoowardToastStyles = makeStyles(theme =>
  createStyles({
    '@keyframes levelEnter': {
      '100%': {
        transform: 'scale(1)',
      },
    },

    '@keyframes levelFlash': {
      '100%': {
        opacity: 0,
      },
    },

    root: {
      display: 'flex',
      alignItems: 'center',
    },

    imageContainer: {
      position: 'relative',
      width: 60,
      height: 60,
      flexShrink: 0,
      marginRight: theme.spacing(2),
    },

    confettiAnimation: {
      position: 'absolute',
      top: -40,
      right: -40,
      left: -40,
      bottom: -40,

      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.75,
    },

    toast: {
      background: `${theme.palette.purple.main} !important`,
    },

    levelImage: {
      position: 'absolute',
      top: -15,
      right: -10,
      left: -10,
      bottom: -10,
      zIndex: 10,
      backgroundImage: `url(${getCachedSrc({ src: monthLevelOne })}`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      filter: 'drop-shadow(-3px 3px 4px rgba(0, 0, 0, 0.4))',
    },

    details: {
      position: 'relative',
      zIndex: 15,
      flex: 1,
      overflow: 'hidden',
      marginLeft: theme.spacing(2),
    },

    header: {
      display: 'flex',
      alignItems: 'center',
    },

    headerText: {
      fontSize: 16,

      fontWeight: theme.typography.fontWeightBold,
      lineHeight: '16px',
      color: '#fff',
    },

    message: {
      color: 'rgba(255, 255, 255, 0.65)',

      fontWeight: theme.typography.fontWeightRegular,
      fontSize: 15,
      lineHeight: '15px',
    },

    name: {
      fontWeight: theme.typography.fontWeightBold,
    },

    level: {
      color: theme.palette.secondary.main,

      fontWeight: theme.typography.fontWeightBold,
    },

    levelContainer: {
      position: 'absolute',
      bottom: -5,
      right: -5,
      filter: 'drop-shadow(-1px 2px 1px rgba(0, 0, 0, 0.2))',
      zIndex: 10,
    },

    newLevel: {
      fontSize: 14,
      background: '#3f50b6',
      clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
      padding: '2px 9px',
      textShadow: '-2px 2px 0px rgba(0, 0, 0, 0.3)',
      height: 23,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      fontWeight: theme.typography.fontWeightBold,
      color: '#fff',
      transform: 'scale(1.3)',
      animation: '$levelEnter 0.5s cubic-bezier(0, 0.71, 0.01, 1.12) forwards',
      animationDelay: '0.2s',

      '&:before, &:after': {
        pointerEvents: 'none',
        content: '" "',
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
      },

      '&:after': {
        width: '50%',
        background: 'rgba(255, 255, 255, 0.05)',
        zIndex: 5,
      },
    },

    arrowsContainer: {
      height: 25,
      width: 25,
      filter: 'drop-shadow(2px 3px 0px rgba(0, 0, 0, 0.25))',
    },

    claimButton: {
      marginTop: 4,
    },

    RoowardsLevelUpToast: {
      background: `${theme.palette.purple.main} !important`,
      filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,.3))',
      display: 'flex',
      padding: 16,
      alignItems: 'center',
      width: 320,
      borderRadius: 3,
      cursor: 'pointer',
      color: '#fff',

      '&:before': {
        pointerEvents: 'none',
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        content: '" "',
        background: `url(${getCachedSrc({ src: logoPattern })}`,
        backgroundSize: 60,
        opacity: 0.45,
      },

      '&:after': {
        pointerEvents: 'none',
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        bottom: 0,
        zIndex: 20,
        content: '" "',
        background: '#fff',
        animation: '$levelFlash 0.2s linear forwards',
        animationDelay: '0.1s',
      },
    },
  }),
)
