import React from 'react'
import { theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'
import createStyles from '@mui/styles/createStyles'
import makeStyles from '@mui/styles/makeStyles'
import clsx from 'clsx'

import { useSlotPotato } from 'app/hooks'
import { Countdown } from 'app/components/Countdown'

import { ContainerWithFlame, ThreeTimesRewards } from '../Elements'
import { ActiveBanner } from '../HomePage'
import { GeneralBanner } from '../GeneralBanner'
import { TEXT_SHADOW_COLOR, TEXT_SHADOW_COLOR_2 } from '../constants'
import { useGeneralBannerStyles } from '../GeneralBanner/GeneralBanner.styles'

export const useSlotPotatoBannerStyles = makeStyles(theme =>
  createStyles({
    GeneralBanner_noGap: {
      gap: 0,
    },
  }),
)

const SlotPotatoBanner: React.FC = () => {
  const classes = useSlotPotatoBannerStyles()
  const generalBannerClasses = useGeneralBannerStyles({
    bannerBackgroundImage: '',
  })
  const {
    isSlotPotatoActive,
    shouldShowCountdownBanner,
    slotPotato,
    activeGame,
    handleCompleteCountdown,
  } = useSlotPotato()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const isDesktop = useMediaQuery(() => uiTheme.breakpoints.up('lg'), {
    noSsr: true,
  })

  if (slotPotato && isSlotPotatoActive && shouldShowCountdownBanner) {
    return (
      <GeneralBanner
        bannerClassName={clsx({
          [classes.GeneralBanner_noGap]: !isTabletOrDesktop,
          [generalBannerClasses.GeneralBanner_bottomPadding]:
            !isTabletOrDesktop,
        })}
        content={
          <>
            <ContainerWithFlame
              className={clsx({
                [generalBannerClasses.RightMostContainer_tabletAbsolute]:
                  isTabletOrDesktop && !isDesktop,
                [generalBannerClasses.RightMostContainer_desktopAbsolute]:
                  isDesktop,
              })}
              noPadding={isDesktop || !isTabletOrDesktop}
              noBackground={isDesktop || !isTabletOrDesktop}
              withFlame={isTabletOrDesktop && !isDesktop}
              node={
                <Countdown
                  startDateTime={slotPotato.startDateTime}
                  handleCompleteCountdown={handleCompleteCountdown}
                  countdownRenderedProps={{
                    backgroundColor: TEXT_SHADOW_COLOR,
                    textShadowColor: TEXT_SHADOW_COLOR_2,
                  }}
                />
              }
            />
            {isDesktop && <ContainerWithFlame node={<ThreeTimesRewards />} />}
          </>
        }
      />
    )
  }

  if (
    slotPotato &&
    activeGame &&
    isSlotPotatoActive &&
    !shouldShowCountdownBanner
  ) {
    return (
      <ActiveBanner
        games={slotPotato?.games || []}
        activeGameId={activeGame?.game.id || ''}
        gameDuration={slotPotato?.gameDuration || 0}
      />
    )
  }

  return null
}

export default SlotPotatoBanner
