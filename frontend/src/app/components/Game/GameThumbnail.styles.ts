import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import { GAME_THUMBNAIL_BORDER_RADIUS } from './constants'

export const useGameThumbnailStyles = makeStyles(() =>
  createStyles({
    GameThumbnail: {
      position: 'relative',
      width: '100%',
      flexShrink: 0,
      display: 'grid',

      '& > div:first-child': {
        height: '100%',
        width: '100%',
      },

      '& $GameThumbnail__image': {
        backgroundSize: 'contain',
        height: '100%',

        '&:before': {
          content: '" "',
          paddingBottom: '100%',
          display: 'inline-block',
          verticalAlign: 'top',
          pointerEvents: 'none',
          cursor: 'pointer',
        },
      },
    },

    GameThumbnail_inline: {
      width: '100%',
      minWidth: 180,
      maxWidth: 208,
      marginRight: 15,

      '& $GameThumbnail__image': {
        height: 97,
      },

      '& $GameDetails__provider': {
        fontSize: 12,
        lineHeight: '12px',
      },
    },

    GameThumbnail__image: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      height: 110,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: GAME_THUMBNAIL_BORDER_RADIUS,
      overflow: 'hidden',
      boxShadow: '0px 4px 6px rgb(20 18 43 / 60%)',

      '&:hover': {
        border: `2px solid ${uiTheme.palette.common.white}`,
      },

      '&:hover $GameThumbnail__play': {
        [uiTheme.breakpoints.up('md')]: {
          opacity: 1,
        },
      },
      '&:hover img': {
        [uiTheme.breakpoints.up('md')]: {
          transform: 'scale(1.07)',
        },
      },

      [uiTheme.breakpoints.up('md')]: {
        backgroundSize: 'cover',
        height: 140,
      },
    },

    GameThumbnail__lazyImage: {
      display: 'flex',
      width: '100%',
      height: '100%',
      userSelect: 'none',
      transition: '.3s ease',
      transform: 'scale(1)',
    },

    GameThumbnail__image_searchImage: {
      '&$GameThumbnail__image': {
        height: '100%',
        width: '100%',
        borderRadius: uiTheme.shape.borderRadius,
      },
    },

    GameThumbnail_searchLink: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textDecoration: 'none',
      height: '100%',

      '& $GameDetails': {
        margin: 0,
        display: 'flex',
        alignSelf: 'center',
        justifyContent: 'space-between',
      },

      '& $GameDetails__provider': {
        fontSize: 18,
        lineHeight: '1.1em',
        marginTop: 10,
        textAlign: 'start',
      },
    },

    GameThumbnail__play: {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,

      pointerEvents: 'none',
      opacity: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      background: 'rgba(0, 0, 0, 0.6)',
      transition: 'opacity 0.15s linear',
    },

    GameThumbnail__playButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      color: '#fff',
      fontSize: '1.7rem',

      width: 70,
      height: 70,
      background: 'rgba(0, 0, 0, 0.5)',
      borderRadius: '100%',

      '& > svg, i': {
        marginLeft: 6,
      },
    },

    GameDetails: {
      display: 'flex',
      marginTop: uiTheme.spacing(0.625),
      width: '100%',
      overflow: 'hidden',
      flexDirection: 'column',
    },

    GameDetails__title: {
      color: uiTheme.palette.common.white,

      fontWeight: uiTheme.typography.fontWeightMedium,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },

    GameDetails__provider: {
      textTransform: 'capitalize',
      color: uiTheme.palette.common.white,

      fontWeight: uiTheme.typography.fontWeightRegular,
      opacity: 0.6,
      fontSize: 13,
      width: '100%',
      overflow: 'hidden',
      textOverflow: 'hidden',
      textAlign: 'center',
      whiteSpace: 'normal',
    },

    GameThumbnail__image_scaledImage: {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      bottom: 0,
      transform: 'scale(1.3)',
    },
  }),
)
