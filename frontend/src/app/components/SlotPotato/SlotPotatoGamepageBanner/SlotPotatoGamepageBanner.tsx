import React from 'react'
import clsx from 'clsx'
import { useHistory } from 'react-router-dom'
import { Button, Typography, theme as uiTheme } from '@project-atl/ui'
import { Skeleton, useMediaQuery } from '@mui/material'

import { type SlotPotatoGame } from 'app/gql/slotPotato'
import { getCachedSrc } from 'common/util'
import { useTranslate } from 'app/hooks'
import { Countdown } from 'app/components/Countdown'

import { GeneralBanner } from '../GeneralBanner'
import { ContainerWithFlame, ThreeTimesRewards } from '../Elements'
import { useGeneralBannerStyles } from '../GeneralBanner/GeneralBanner.styles'
import { TEXT_SHADOW_COLOR, TEXT_SHADOW_COLOR_2 } from '../constants'

import { useSlotPotatoGamepageBannerStyles } from './SlotPotatoGamepageBanner.styles'

export interface SlotPotatoGamepageBannerProps {
  games: SlotPotatoGame[]
  handleSetActiveGame: (cb?: () => void) => void
  currentGamePageId?: string
  activeGameId?: string
  handleCompleteCountdown: () => void
}

export const SlotPotatoGamepageBanner: React.FC<
  SlotPotatoGamepageBannerProps
> = ({
  games,
  activeGameId,
  handleSetActiveGame,
  currentGamePageId,
  handleCompleteCountdown,
}) => {
  const history = useHistory()
  const classes = useSlotPotatoGamepageBannerStyles()
  const generalBannerClasses = useGeneralBannerStyles({
    bannerBackgroundImage: '',
  })
  const translate = useTranslate()

  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const isDesktop = useMediaQuery(() => uiTheme.breakpoints.up('lg'), {
    noSsr: true,
  })

  const activeSlot = games.find(({ game }) => game.id === activeGameId)

  const handleOnClick = () => {
    if (activeSlot) {
      handleSetActiveGame(() => {
        history.push(`/game/${activeSlot.game.identifier}`)
      })
    }
  }

  const isOnActiveGamePage = currentGamePageId === activeGameId

  const node = React.useMemo(() => {
    if (activeSlot) {
      if (isOnActiveGamePage) {
        return (
          <Countdown
            startDateTime={activeSlot.endDateTime}
            handleCompleteCountdown={handleCompleteCountdown}
            countdownRenderedProps={{
              backgroundColor: TEXT_SHADOW_COLOR,
              textShadowColor: TEXT_SHADOW_COLOR_2,
              countdownText: translate('slotPotato.timeLeftOnSlot'),
            }}
          />
        )
      }

      return (
        <div className={classes.ActiveSlotGameContainer}>
          <img
            className={classes.ActiveSlotGameImage}
            src={getCachedSrc({
              src: activeSlot.game.squareImage,
              quality: 85,
            })}
            alt={activeSlot.game.title}
            width={48}
            height={48}
          ></img>
          <div className={classes.ActiveSlotGameTextContainer}>
            <Typography
              className={classes.ActiveSlotGameText}
              variant="body2"
              fontWeight={uiTheme.typography.fontWeightBlack}
            >
              {activeSlot.game.title}
            </Typography>
            <Typography
              className={classes.ActiveSlotGameText}
              variant="body4"
              fontWeight={uiTheme.typography.fontWeightMedium}
            >
              {translate('slotPotato.nextSlot')}
            </Typography>
          </div>
          <div className={classes.ActiveSlotGameButton}>
            <Button
              color="primary"
              variant="contained"
              size="medium"
              label={translate('slotPotato.playNow')}
              onClick={handleOnClick}
            />
          </div>
        </div>
      )
    }
    return (
      <Skeleton
        className={classes.ActiveSlotGameSkeleton}
        variant="rectangular"
        width={200}
        height={56}
      />
    )
  }, [isOnActiveGamePage, activeSlot])
  return (
    <GeneralBanner
      bannerClassName={clsx({
        [generalBannerClasses.GeneralBanner_bottomPadding]:
          isOnActiveGamePage && !isTabletOrDesktop,
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
            node={node}
          />
          {isDesktop && <ContainerWithFlame node={<ThreeTimesRewards />} />}
        </>
      }
    />
  )
}
