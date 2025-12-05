import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import heads from 'assets/images/raffle/advent/heads.png'
import tails from 'assets/images/raffle/advent/tails.png'
import { getCachedSrc } from 'common/util'

export const useAdventPrizeDialogStyles = makeStyles(theme =>
  createStyles({
    AdventPrizeModal__paper: {
      display: 'flex',
      alignItems: 'center',
      background: theme.palette.background.default,
      overflow: 'auto',

      [uiTheme.breakpoints.up('md')]: {
        overflow: 'hidden',
        justifyContent: 'center',
      },
    },

    AdventPrizeModal__background: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      zIndex: 0,
      opacity: 0.1,
      overflow: 'hidden',
      pointerEvents: 'none',
    },

    AdventPrizeModal: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      width: '100%',
      height: '100%',
      padding: theme.spacing(2),
      zIndex: 5,
      color: '#fff',

      [uiTheme.breakpoints.up('md')]: {
        maxWidth: 375,
        maxHeight: 775,
      },
    },

    AdventPrizeModal_claiming: {
      filter: 'blur(6px)',
    },

    AdventPrizeModal__banner: {
      width: '100%',
      height: 160,
      margin: `${theme.spacing(3)} 0 125px 0`,

      [uiTheme.breakpoints.up('md')]: {
        height: 200,
      },

      '$AdventPrizeModal_claiming &': {
        filter: 'blur(6px)',
      },
    },

    AdventPrizeModal__prizes: {
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      maxWidth: 200,
      flexShrink: 0,

      [uiTheme.breakpoints.up('md')]: {
        maxWidth: 300,
      },
    },

    Prizes__prize: {
      width: '100%',
      maxWidth: 'unset',
    },

    // Do not remove.
    AdventPrizeModal__actions_divider: {},

    AdventPrizeModal__actions: {
      marginTop: 'auto',
      width: '100%',
      display: 'grid',
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'repeat(2, 1fr)',
      gap: theme.spacing(1),

      [uiTheme.breakpoints.up('md')]: {
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: '1fr',
        marginTop: '32px',
      },

      '&$AdventPrizeModal__actions_divider': {
        borderTop: '1px solid rgba(121, 117, 150, 0.1)',
        paddingTop: '32px',
      },
    },

    AdventPrizeModal__claim_container: {
      borderRadius: '5px',
      background:
        'linear-gradient(93deg, #C99932 11.06%, #FFDF9D 51.76%, #ECBA4F 88.28%)',
      boxShadow: '0px 0px 25px 5px rgba(238, 189, 85, 0.30)',
      padding: '4px',
      width: '100%',
      // marginTop: '100px',
    },

    AdventPrizeModal__claim: {
      borderRadius: '5px',
      background: '#4F498A',
      width: '100%',
      padding: '28px 0',
      textAlign: 'center',
      color: 'rgba(255,255,255,0.5)',
    },

    AdventPrizeModal__claim_amount: {
      background:
        'linear-gradient(93deg, #C99932 11.06%, #FFDF9D 51.76%, #ECBA4F 88.28%)',
      backgroundClip: 'text',
      '-webkit-background-clip': 'text',
      color: 'transparent',
      fontSize: '48px',
      fontWeight: 700,
      lineHeight: '56px',
    },

    AdventPrizeModal__coinflip_cta: {
      padding: '16px 0',
      lineHeight: '28px',
      textAlign: 'center',
    },

    AdventPrizeModal__coinflip_cta_title: {
      fontSize: '24px',
      fontWeight: 700,
    },

    AdventPrizeModal__coin: {
      position: 'absolute',
      top: 0,
      display: 'flex',
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      transition: '-webkit-transform 1s ease-in',
      'transform-style': 'preserve-3d',
      zIndex: 10,
      animation: '$fadeIn 0.5s ease-in',

      '&[data-animate="heads"]': {
        animation: '$flipHeads 3s ease-out forwards',
      },

      '&[data-animate="tails"]': {
        animation: '$flipTails 3s ease-out forwards',
      },
    },

    AdventPrizeModal__coin_side: {
      backgroundSize: 'cover',
      position: 'absolute',
      'backface-visibility': 'hidden',
      width: '150px',
      height: '150px',

      '&[data-side="heads"]': {
        backgroundImage: `url(${getCachedSrc({ src: heads })})`,
        zIndex: '100',
      },

      '&[data-side="tails"]': {
        backgroundImage: `url(${getCachedSrc({ src: tails })})`,
        transform: 'rotateY(-180deg)',
      },
    },

    AdventPrizeModal__coinflip: {
      borderRadius: '4px',
      background: '#363264',
      padding: '12px',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      '& > *': {
        margin: '0 6px',
      },
    },

    AdventPrizeModal__coinflip_label: {
      fontWeight: 500,
      color: '#fff',
    },

    AdventPrizeModal__coinflip_side: {
      width: '48px',
      height: '48px',
      backgroundSize: 'cover',
      opacity: '0.5',

      '&[data-selected="true"]': {
        opacity: 1,
      },

      '&[data-enabled="true"]': {
        cursor: 'pointer',
      },

      '&[data-side="heads"]': {
        backgroundImage: `url(${getCachedSrc({ src: heads })})`,
      },

      '&[data-side="tails"]': {
        backgroundImage: `url(${getCachedSrc({ src: tails })})`,
      },
    },

    '@keyframes flipHeads': {
      from: { transform: 'rotateY(0)' },
      to: { transform: 'rotateY(1800deg)' },
    },

    '@keyframes flipTails': {
      from: { transform: 'rotateY(0)' },
      to: { transform: 'rotateY(1980deg)' },
    },

    '@keyframes fadeIn': {
      from: { transform: 'scale(0)', opacity: 0 },
      to: { transform: 'scale(1)', opacity: 1 },
    },

    '@keyframes raysSpin': {
      from: {
        transform: 'rotate(0deg)',
      },

      to: {
        transform: 'rotate(360deg)',
      },
    },

    Prize_claimed: {
      filter: 'brightness(100)',
      animation: '$Prize_claimed 0.4s linear forwards',
    },

    '@keyframes Prize_claimed': {
      '0%': {
        filter: 'brightness(100)',
      },

      '100%': {
        filter: 'brightness(1)',
      },
    },
  }),
)
