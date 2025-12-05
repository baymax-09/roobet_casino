import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'

import { TEXT_SHADOW_COLOR } from '../../constants'

export const useLogoAndWordMarkStyles = makeStyles(theme =>
  createStyles({
    LogoAndWordMark: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },

    BeFastBeFurious: {
      textShadow: `0px 2px 0px ${TEXT_SHADOW_COLOR}`,
    },

    SlotPotatoWordMark: {
      height: 36,
      width: 157,
    },
  }),
)
