import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import { theme as uiTheme } from '@project-atl/ui'

import { TEXT_SHADOW_COLOR } from '../constants'

const ACTIVE_GAME_BORDER_RADIUS = 16

export const useSlotPotatoGamepageBannerStyles = makeStyles(theme =>
  createStyles({
    ActiveSlotGameContainer: {
      display: 'flex',
      gap: theme.spacing(1.5),
      padding: `${theme.spacing(0.5)} ${theme.spacing(1.25)} ${theme.spacing(
        0.5,
      )} ${theme.spacing(0.5)}`,
      backgroundColor: TEXT_SHADOW_COLOR,
      width: 'fit-content',
      borderRadius: ACTIVE_GAME_BORDER_RADIUS,
      color: theme.palette.common.white,
    },

    ActiveSlotGameImage: {
      borderRadius: 12,
    },

    ActiveSlotGameTextContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'start',
      justifyContent: 'center',

      [uiTheme.breakpoints.up('md')]: {
        width: 'auto',
      },
    },

    ActiveSlotGameText: {
      width: 'inherit',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    },

    ActiveSlotGameButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },

    ActiveSlotGameSkeleton: {
      borderRadius: ACTIVE_GAME_BORDER_RADIUS,
    },
  }),
)
