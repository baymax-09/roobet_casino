import React from 'react'
import { Typography, theme as uiTheme, Explainer } from '@project-atl/ui'
import { Info } from '@project-atl/ui/assets'
import ReactCountdown from 'react-countdown'
import moment from 'moment'
import Lottie from 'react-lottie'
import { useMediaQuery } from '@mui/material'
import clsx from 'clsx'

import desktopKingBackground from 'assets/images/koth/desktopKingBackground.png'
import desktopAstroBackground from 'assets/images/koth/desktopAstroBackground.png'
import mobileKingBackground from 'assets/images/koth/mobileKingBackground.png'
import mobileAstroBackground from 'assets/images/koth/mobileAstroBackground.png'
import tabletKingBackground from 'assets/images/koth/tabletKingBackground.png'
import tabletAstroBackground from 'assets/images/koth/tabletAstroBackground.png'
import activeAnimationData from 'app/lottiefiles/koth/active_crown_animation.json'
import inactiveAnimationData from 'app/lottiefiles/koth/inactive_crown_animation.json'
import { AnimatedNumber, Skeleton } from 'mrooi'
import { useCurrencyDisplay, useDialogsOpener, useTranslate } from 'app/hooks'
import { getCachedSrc } from 'common/util'
import { useApp } from 'app/context'

import { useKOTH } from './useKOTH'
import { CallToAction } from './CallToAction'
import { Countdown } from '../Countdown'
import { TEXT_SHADOW_COLOR } from './constants'
import { GameThumbnailImage } from '../Game/GameThumbnail'
import { GameLink } from '../Game/GameLink'

import { useKOTHBannerStyles } from './KOTHBanner.styles'

const KOTH_DEFAULT_MULTIPLIER = 100
const ASTRO_DEFAULT_MULTIPLIER = 1.01

interface KOTHBannerProps {
  minimal?: boolean
  page?: string
  containerClassname?: string
  whichRoo?: 'astro' | 'king'
}

const ActiveAnimationOptions = {
  loop: true,
  autoplay: true,
  animationData: activeAnimationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid meet',
  },
}

const InactiveAnimationOptions = {
  loop: true,
  autoplay: true,
  animationData: inactiveAnimationData,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid meet',
  },
}

export const KOTHBanner: React.FC<KOTHBannerProps> = ({
  minimal = false,
  page,
  containerClassname,
  whichRoo: whichRooKnown,
}) => {
  const { chatHidden, sideNavigationOpen } = useApp()

  const translate = useTranslate()
  const displayCurrencyExchange = useCurrencyDisplay()
  const openDialog = useDialogsOpener()

  const {
    loading: useKOTHLoading,
    currentKing,
    earnings,
    timerText,
    whichRoo,
    showKoth,
    kothState,
    refresh,
  } = useKOTH(whichRooKnown)

  const exchangedEarnings = displayCurrencyExchange(earnings)

  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const isDesktop = useMediaQuery(() => uiTheme.breakpoints.up('lg'), {
    noSsr: true,
  })

  const isExtraLargeDesktop = useMediaQuery(
    () => uiTheme.breakpoints.up('xl'),
    {
      noSsr: true,
    },
  )

  const astroRoo = whichRoo === 'astro'
  const kingRoo = whichRoo === 'king'
  const startingSoon = kothState === 'starting'

  const src = React.useMemo(() => {
    if (astroRoo) {
      if (isDesktop) {
        return desktopAstroBackground
      }
      if (isTabletOrDesktop) {
        return tabletAstroBackground
      }
      return mobileAstroBackground
    }
    if (isDesktop) {
      return desktopKingBackground
    }
    return isTabletOrDesktop ? tabletKingBackground : mobileKingBackground
  }, [astroRoo, isTabletOrDesktop, isDesktop])

  const classes = useKOTHBannerStyles({
    bannerBackgroundImage: getCachedSrc({
      src,
    }),
    startingSoon,
    whichRoo,
  })

  if (page) {
    if ((astroRoo && page !== 'crash') || (kingRoo && page !== 'slots')) {
      return null
    }
  }

  if (!showKoth) {
    return null
  }

  const loading = useKOTHLoading || !whichRoo

  const showCTA = (isDesktop || (!isTabletOrDesktop && !isDesktop)) && !loading

  // Force mobile view when the sidebar or chat are open between medium and large viewports.
  const forceMobileView =
    (sideNavigationOpen || !chatHidden) && isTabletOrDesktop && !isDesktop
  const forceMediumView = !chatHidden && isDesktop && !isExtraLargeDesktop

  const showGameImage =
    currentKing && currentKing.gameIdentifier && currentKing.gameImage

  const multiplier = astroRoo
    ? currentKing?.gameMult.toFixed(2) ?? ASTRO_DEFAULT_MULTIPLIER
    : KOTH_DEFAULT_MULTIPLIER

  return (
    <div className={containerClassname}>
      <div
        className={clsx(classes.KothBanner, classes.KothBanner_base, {
          [classes.KothBanner_force_mobile]: forceMobileView,
          [classes.KothBanner_force_medium]: forceMediumView,
          [classes.KothBanner_mobile]:
            (forceMobileView && isTabletOrDesktop && !isDesktop) ||
            !isTabletOrDesktop,
        })}
      >
        {!loading ? (
          <div className={clsx(classes.TitleBlock, classes.TitleBlock_order)}>
            <div className={classes.TitleBlock__textContent}>
              <div className={classes.TitleBlock__headerContainer}>
                <Typography
                  component="span"
                  variant="h5"
                  color={uiTheme.palette.common.white}
                  className={classes.Title__header}
                  fontWeight={uiTheme.typography.fontWeightBlack}
                >
                  {astroRoo
                    ? translate('kothBanner.astro')
                    : translate('kothBanner.king')}{' '}
                  <Typography
                    component="span"
                    variant="h5"
                    color={uiTheme.palette.secondary[600]}
                    className={classes.Title__header}
                    fontWeight={uiTheme.typography.fontWeightBlack}
                  >
                    {translate('kothBanner.roo')}
                  </Typography>
                </Typography>
              </div>
              <div className={classes.Title__subheaderContainer}>
                {startingSoon ? (
                  <Typography
                    variant="body2"
                    color={uiTheme.palette.common.white}
                    className={classes.Title__subheader}
                    fontWeight={uiTheme.typography.fontWeightBlack}
                    display="flex"
                    textAlign="center"
                    whiteSpace={isTabletOrDesktop ? 'nowrap' : 'normal'}
                  >
                    {astroRoo ? (
                      translate('kothBanner.astroStarting')
                    ) : (
                      <div>
                        {translate('kothBanner.kothStarting1')}{' '}
                        <Typography
                          variant="body2"
                          component="span"
                          color={uiTheme.palette.secondary[600]}
                          fontWeight={uiTheme.typography.fontWeightBlack}
                        >
                          {translate('kothBanner.hundredX')}{' '}
                        </Typography>
                        {translate('kothBanner.kothStarting2')}
                      </div>
                    )}
                  </Typography>
                ) : (
                  <>
                    {earnings ? (
                      <Typography
                        variant="body2"
                        color={uiTheme.palette.common.white}
                        className={classes.Title__subheader}
                        fontWeight={uiTheme.typography.fontWeightBlack}
                      >
                        {translate('kothBanner.totalEarnedByKings')}{' '}
                        <AnimatedNumber
                          className={classes.Earnings}
                          value={exchangedEarnings.exchangedAmount}
                          symbol={exchangedEarnings.currencySymbol}
                          format="0,0.00"
                        />
                      </Typography>
                    ) : (
                      <Typography
                        variant="body2"
                        color={uiTheme.palette.common.white}
                        className={classes.Title__subheader}
                        fontWeight={uiTheme.typography.fontWeightBlack}
                      >
                        {translate('kothBanner.becomeTheNextKing')}
                      </Typography>
                    )}
                  </>
                )}
                <Info
                  width={16}
                  height={16}
                  className={classes.InfoIcon}
                  iconFill={uiTheme.palette.primary[25]}
                  onClick={() => openDialog('koth')}
                />
              </div>
            </div>
            {((isTabletOrDesktop && !isDesktop && kothState !== 'starting') ||
              forceMediumView) && (
              <CallToAction
                leaderboardButton={!minimal}
                whichRoo={whichRoo}
                timerText={timerText}
                showTimerWithButton={isTabletOrDesktop}
                kothState={kothState}
                loading={loading}
              />
            )}
          </div>
        ) : (
          <Skeleton
            className={classes.TitleBlock_order}
            width={240}
            height={56}
            variant="rectangular"
            animation="wave"
          />
        )}

        {startingSoon ? (
          <div className={classes.CountdownContainer}>
            {!timerText || loading ? (
              <Skeleton
                width={150}
                height={88}
                variant="rectangular"
                animation="wave"
              />
            ) : (
              <Countdown
                startDateTime={timerText}
                handleCompleteCountdown={refresh}
                countdownRenderedProps={{
                  backgroundColor: uiTheme.palette.primary[700],
                  textShadowColor: TEXT_SHADOW_COLOR,
                }}
              />
            )}
          </div>
        ) : (
          <>
            {!loading ? (
              <div className={classes.KothBanner__currentKingContainer}>
                <div
                  className={clsx(
                    classes.KothBanner__currentKing,
                    classes.KothBanner__currentKing_order,
                    {
                      [classes.KothBanner__currentKing_gameImage]:
                        showGameImage,
                    },
                  )}
                >
                  <div className={classes.KothBanner__crownAnimation}>
                    <Lottie
                      options={
                        currentKing
                          ? ActiveAnimationOptions
                          : InactiveAnimationOptions
                      }
                      height={106}
                      width={106}
                    />
                  </div>
                  <div className={classes.KingContainer}>
                    <div className={classes.KingContainer__text}>
                      <Typography
                        variant="body2"
                        color={uiTheme.palette.common.white}
                        fontWeight={uiTheme.typography.fontWeightBlack}
                      >
                        {currentKing
                          ? currentKing.hidden
                            ? translate('generic.hiddenName')
                            : currentKing.name
                          : translate('kothBanner.kingNotCrowned')}
                      </Typography>
                      {currentKing ? (
                        <div
                          className={classes.KingContainer__text__currentKing}
                        >
                          <Typography
                            variant="body4"
                            color={uiTheme.palette.common.white}
                            fontWeight={uiTheme.typography.fontWeightBold}
                            maxWidth="106px"
                            textOverflow="ellipsis"
                            overflow="hidden"
                          >
                            {currentKing.gameName}
                          </Typography>
                          <Typography
                            variant="body4"
                            color={uiTheme.palette.secondary[600]}
                            fontWeight={uiTheme.typography.fontWeightMedium}
                          >
                            {translate('kothBanner.bottomMessage2', {
                              multiplier: currentKing.gameMult.toFixed(2),
                            })}
                          </Typography>
                        </div>
                      ) : (
                        <Typography
                          variant="body4"
                          color={uiTheme.palette.common.white}
                          fontWeight={uiTheme.typography.fontWeightMedium}
                        >
                          {translate('kothBanner.keepPlaying')}
                        </Typography>
                      )}
                    </div>
                    {showGameImage && (
                      <GameLink
                        game={{
                          identifier: currentKing.gameIdentifier,
                        }}
                        className={classes.KingContainer_link}
                      >
                        <div className={classes.KingContainer_gameImage}>
                          <GameThumbnailImage
                            game={{
                              title: currentKing.gameName,
                              identifier: currentKing.gameIdentifier,
                              squareImage: currentKing?.gameImage,
                            }}
                          />
                        </div>
                      </GameLink>
                    )}
                  </div>
                </div>
                <div className={classes.CurrentKing}>
                  <Typography
                    variant="body4"
                    color={uiTheme.palette.neutral[900]}
                    fontWeight={uiTheme.typography.fontWeightBold}
                  >
                    {translate('kothBanner.currentKing')}
                  </Typography>
                </div>
                <div className={classes.BottomMessage}>
                  <div className={classes.BottomMessage__multiplierText}>
                    <Typography
                      variant="body4"
                      color={uiTheme.palette.common.white}
                      fontWeight={uiTheme.typography.fontWeightBold}
                    >
                      {astroRoo
                        ? translate('kothBanner.astroBottomMessage1')
                        : translate('kothBanner.kothBottomMessage1')}{' '}
                      <Typography
                        variant="body4"
                        color={uiTheme.palette.secondary[600]}
                        fontWeight={uiTheme.typography.fontWeightBold}
                      >
                        {translate('kothBanner.bottomMessage2', {
                          multiplier,
                        })}{' '}
                      </Typography>
                      {astroRoo
                        ? translate('kothBanner.astroBottomMessage3')
                        : translate('kothBanner.kothBottomMessage3')}
                    </Typography>
                  </div>
                  {!isTabletOrDesktop && timerText && (
                    <ReactCountdown
                      date={moment(timerText).unix() * 1000}
                      renderer={({
                        formatted: { hours, minutes, seconds },
                      }) => (
                        <Explainer
                          className={classes.BottomMessage__explainer}
                          message={
                            kothState === 'ended'
                              ? translate('kothBanner.ended')
                              : translate('kothBanner.endsIn') +
                                ' ' +
                                translate('kothBanner.times', {
                                  hours,
                                  minutes,
                                  seconds,
                                })
                          }
                          backgroundColor={uiTheme.palette.primary[700]}
                        />
                      )}
                    />
                  )}
                </div>
              </div>
            ) : (
              <Skeleton
                className={classes.KothBanner__currentKing_order}
                width={242}
                height={56}
                variant="rectangular"
                animation="wave"
              />
            )}
            {showCTA && !forceMediumView && (
              <CallToAction
                leaderboardButton={!minimal}
                whichRoo={whichRoo}
                timerText={timerText}
                showTimerWithButton={isTabletOrDesktop}
                kothState={kothState}
                loading={loading}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default React.memo(KOTHBanner)
