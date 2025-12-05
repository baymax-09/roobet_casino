import React from 'react'
import clsx from 'clsx'
import { useSelector } from 'react-redux'
import { useQuery } from '@apollo/client'
import { useHistory } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'

import { KOTHBanner } from 'app/components'
import { RaffleBanners } from 'app/components/Raffle'
import { SlotPotatoBanner } from 'app/components/SlotPotato'
import {
  GameListTagSkeleton,
  HomepageRenderGameList,
} from 'app/components/GameList'
import { GameTagsQuery } from 'app/gql'
import { type GameTagsResults } from 'common/types'
import charlesOliveira from 'assets/images/games/sportsbetting/charlesOliveira.png'
import sportsbookBg from 'assets/images/games/sportsbetting/sportsbookBg.png'
import casinoBg from 'assets/images/games/casino/casinoBg.png'
import roulette from 'assets/images/games/casino/roulette.png'
import pokerChip1 from 'assets/images/games/casino/pokerChip1.png'
import pokerChip2 from 'assets/images/games/casino/pokerChip2.png'
import pokerChip3 from 'assets/images/games/casino/pokerChip3.png'
import dice from 'assets/images/games/casino/dice.png'
import card from 'assets/images/games/casino/card.png'
import { getCachedSrc } from 'common/util'
import { useIsLoggedIn } from 'app/hooks'

import GameCTA, { type HomepageGameCTAConfigs } from './GameCTA'
import { SportsbookList } from './SportsbookList'
import { RoobetPartners } from './RoobetPartners'
import { CASINO_LOBBY_LINK } from '../CasinoPageRoute'
import { RegisterNowCarouselBanner } from './RegisterNowCarouselBanner'

import { useHomepageRouteStyles } from './HomepageRoute.styles'

const HomepageRoute: React.FC = () => {
  const classes = useHomepageRouteStyles()
  const history = useHistory()
  const { i18n } = useTranslation()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })

  const isLoggedIn = useIsLoggedIn()
  const loadedUser = useSelector(({ settings }) => settings.loadedUser)

  /** For a logged out user, if the browser language is Japanese or the user selected the Japanese locale, then
   * send to Custom JP Homepage. */
  const japaneseBrowserLanguage =
    navigator.language === 'ja_JP' || navigator.language === 'ja'
  const japaneseLocaleSelected = i18n.language === 'ja'

  const { data, loading: loadingTags } =
    useQuery<GameTagsResults>(GameTagsQuery)

  React.useEffect(() => {
    if (
      !isLoggedIn &&
      loadedUser &&
      (japaneseBrowserLanguage || japaneseLocaleSelected)
    ) {
      history.push('/jp')
    }
  }, [isLoggedIn, loadedUser, japaneseBrowserLanguage, japaneseLocaleSelected])

  const sportsBettingAndLiveCasinoCTAConfigs: HomepageGameCTAConfigs =
    React.useMemo(
      () => [
        {
          to: CASINO_LOBBY_LINK,
          // t('homepage.casino')
          title: 'homepage.casino',
          // t('homepage.thousandsOfGames')
          subTitle: 'homepage.thousandsOfGames',
          gameIdentifier: 'liveCasino',
          background: {
            src: getCachedSrc({ src: casinoBg }),
          },
          images: [
            {
              src: getCachedSrc({ src: roulette }),
              style: {
                width: isTabletOrDesktop ? 266 : 180,
                top: '-10%',
              },
            },
            {
              src: getCachedSrc({ src: card }),
              style: {
                width: '41%',
                top: '14%',
                right: '-6%',
              },
            },
            {
              src: getCachedSrc({ src: pokerChip1 }),
              style: {
                width: '20%',
                left: '14%',
                top: '3%',
              },
            },
            {
              src: getCachedSrc({ src: pokerChip2 }),
              style: {
                width: '15%',
                top: '-5%',
                right: '43%',
              },
            },
            {
              src: getCachedSrc({ src: pokerChip3 }),
              style: {
                width: '33%',
                top: '35%',
                left: '3%',
              },
            },
            {
              id: 'dice',
              src: getCachedSrc({ src: dice }),
              style: {
                width: '30%',
                bottom: '-2%',
                right: '12%',
              },
            },
          ],
        },
        {
          // t('homepage.sportsBetting')
          title: 'homepage.sportsBetting',
          // t('homepage.supportYourTeam')
          subTitle: 'homepage.supportYourTeam',
          to: '/sports',
          gameIdentifier: 'sportsbetting',
          background: {
            src: getCachedSrc({ src: sportsbookBg }),
          },
          images: [
            {
              src: getCachedSrc({ src: charlesOliveira }),
              style: {
                width: isTabletOrDesktop ? 229 : 153,
                height: isTabletOrDesktop ? 229 : 153,
                top: isTabletOrDesktop ? -13 : -15,
              },
            },
          ],
        },
      ],
      [isTabletOrDesktop],
    )

  const tags = data?.gameTags || []
  // We only want to show these 2 tags on the homepage
  const popularTag = tags.find(tag => tag.slug === 'popular')
  const roobetExclusivesTag = tags.find(tag => tag.slug === 'roobet-games')

  return (
    <div className={classes.root}>
      <div className={classes.container}>
        <KOTHBanner minimal containerClassname={classes.KOTHBanner} />
        {!isLoggedIn && <RegisterNowCarouselBanner />}
        <SlotPotatoBanner />
        <RaffleBanners />
        <div
          className={clsx({
            [classes.games]: true,
            [classes.firstGames]: true,
          })}
        >
          {sportsBettingAndLiveCasinoCTAConfigs.map(gameCTAConfig => (
            <GameCTA {...gameCTAConfig} key={gameCTAConfig.title} />
          ))}
        </div>
        {loadingTags || !roobetExclusivesTag ? (
          <GameListTagSkeleton tags={1} />
        ) : (
          <HomepageRenderGameList
            key={roobetExclusivesTag?.slug}
            tag={roobetExclusivesTag}
          />
        )}
        {loadingTags || !popularTag ? (
          <GameListTagSkeleton tags={1} />
        ) : (
          <HomepageRenderGameList key={popularTag?.slug} tag={popularTag} />
        )}
        <SportsbookList />
        <RoobetPartners />
      </div>
    </div>
  )
}

export default React.memo(HomepageRoute)
