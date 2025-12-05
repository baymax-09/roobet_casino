import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import rays from 'assets/images/raffle/advent/rays.png'
import { getCachedSrc } from 'common/util'

import { getAdventImage } from './utils/getAdventImages'

interface AdventPrizeStylesParams {
  gridArea: number
  opened: boolean
  day: number
}

export const useAdventPrizeStyles = makeStyles(theme =>
  createStyles({
    AdventPrize: ({ gridArea, opened }: AdventPrizeStylesParams) => ({
      gridArea,
      position: 'relative',
      borderRadius: theme.shape.borderRadius,
      cursor: 'pointer',
      transition: 'opacity 0.3s linear',
      opacity: opened ? 0.5 : 1,

      width: '100%',
      maxWidth: '33.33%',
      marginBottom: uiTheme.spacing(4),

      [uiTheme.breakpoints.up('md')]: {
        width: 200,
        marginBottom: 0,
        maxWidth: 'unset',
      },

      '&:after': {
        content: '" "',
        paddingBottom: '100%',
        display: 'inline-block',
        verticalAlign: 'top',
        pointerEvents: 'none',
        cursor: 'pointer',
      },
    }),

    AdventPrize_disabled: {
      cursor: 'not-allowed !important',
    },

    AdventPrize__claimPrize: ({ day, opened }) => ({
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      zIndex: 5,
      width: '100%',
      height: '100%',
      backgroundImage: `url(${getAdventImage({ opened, day })})`,
      backgroundPosition: 'center',
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      filter: 'drop-shadow(2px 4px 6px black)',
    }),

    RaysContainer__rays: {
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      margin: '-30%',
      background: `url(${getCachedSrc({ src: rays })}) 0 0 no-repeat`,
      backgroundSize: 'contain',
      animation: '$raysSpin 80000ms linear infinite',
    },

    '@keyframes raysSpin': {
      from: {
        transform: 'rotate(0deg)',
      },

      to: {
        transform: 'rotate(360deg)',
      },
    },
  }),
)
