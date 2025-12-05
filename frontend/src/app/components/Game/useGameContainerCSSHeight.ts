import { type Theme, useMediaQuery } from '@mui/material'
import { theme as uiTheme } from '@project-atl/ui'

import { useApp } from 'app/context'

/**
 * The border below the nav bar. Needs to be global putting here for now.
 */
const BORDER_HEIGHT = 4

/**
 * This calculates the height of the game container.
 * This can be purely CSS driven if dimensions are known on the :root
 */
export const useGameContainerCSSHeight = () => {
  const { hasBanner } = useApp()
  const isTabletOrDesktop = useMediaQuery<Theme>(
    () => uiTheme.breakpoints.up('md'),
    {
      noSsr: true,
    },
  )

  const navHeight = isTabletOrDesktop
    ? uiTheme.shape.toolbarHeight.desktop
    : uiTheme.shape.toolbarHeight.mobile

  const bannerHeight = hasBanner ? 56 : 0

  /**
   * Ideally it would be best to shove this into a CSS variable
   * and the style sheet can handle the responsive styling.
   */
  return isTabletOrDesktop
    ? `calc(100vh - ${navHeight + bannerHeight + BORDER_HEIGHT}px)`
    : undefined
}
