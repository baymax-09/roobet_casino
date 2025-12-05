import React from 'react'
import {
  Kangaroo,
  Favorites,
  Popular,
  Slots,
  LiveCasino,
  Blackjack,
  Baccarat,
  Sportsbook,
  Basketball,
  BonusBuys,
  GameShows,
  Tennis,
  CounterStrike,
  Fifa,
  Baseball,
  IceHockey,
  Cricket,
  MMA,
  TableTennis,
  Roulette,
} from '@project-atl/ui/assets'
import { Typography, theme as uiTheme } from '@project-atl/ui'
import { type TFunction } from 'react-i18next'

import {
  basketballSearchLink,
  counterStrikeSearchLink,
  soccerSearchLink,
  localizations,
  tennisSearchLink,
  fifaSearchLink,
  baseballSearchLink,
  iceHockeySearchLink,
  cricketSearchLink,
  mmaSearchLink,
  tableTennisSearchLink,
} from 'app/constants'
import {
  CASINO_GAME_SHOWS_LINK,
  CASINO_LIVE_CASINO_LINK,
  CASINO_LOBBY_LINK,
  CASINO_POPULAR_LINK,
  CASINO_ROOBET_GAMES_LINK,
  CASINO_SLOTS_LINK,
} from 'app/routes/CasinoPageRoute'
import {
  GAME_TAG_BACCARAT_LINK,
  GAME_TAG_BLACKJACK_LINK,
  GAME_TAG_BONUS_BUYS_LINK,
  GAME_TAG_FAVORITES_LINK,
  GAME_TAG_ROULETTE_LINK,
} from 'app/components/GameList'

const URL_CACHE = new Map<
  string,
  { pathname: string; search: URLSearchParams }
>()

const splitUrlString = (link: string) => {
  if (URL_CACHE.has(link)) {
    return URL_CACHE.get(link)!
  }

  const split = link.split('?')
  const cache = {
    pathname: split[0],
    search: new URLSearchParams(split[1]),
  }
  URL_CACHE.set(link, cache)
  return cache
}

const splitLocation = (location: Location) => {
  return {
    pathname: location.pathname,
    search: new URLSearchParams(location.search),
  }
}

export const checkIfActive = (location, link) => {
  const url = splitUrlString(link)
  const current = splitLocation(location)

  if (current.pathname !== url.pathname) {
    return false
  }

  // Check if current contains all the urls params of link
  for (const [key, value] of url.search.entries()) {
    if (current.search.get(key) !== value) {
      return false
    }
  }
  return true
}

// User may have a modal open. We only need to assure that they don't have a "category" search param.
export const checkIfLobbyActive = location => {
  return (
    location.pathname === CASINO_LOBBY_LINK &&
    !location.search.includes('category')
  )
}

export const getCasinoItems = (
  translate: TFunction<'translation', undefined>,
  location,
  isLoggedIn: boolean,
) => [
  ...(isLoggedIn
    ? [
        {
          key: 'favorites',
          icon: Favorites,
          text: translate('navbar.favorites'),
          buttonProps: {
            path: GAME_TAG_FAVORITES_LINK,
          },
          active: checkIfActive(location, GAME_TAG_FAVORITES_LINK),
        },
      ]
    : []),
  {
    key: 'kangaroo',
    icon: Kangaroo,
    text: translate('navbar.roobetGames'),
    buttonProps: {
      path: CASINO_ROOBET_GAMES_LINK,
    },
    active: checkIfActive(location, CASINO_ROOBET_GAMES_LINK),
  },
  {
    key: 'popular',
    icon: Popular,
    text: translate('navbar.popular'),
    buttonProps: {
      path: CASINO_POPULAR_LINK,
    },
    active: checkIfActive(location, CASINO_POPULAR_LINK),
  },
  {
    key: 'slots',
    icon: Slots,
    text: translate('navbar.slots'),
    buttonProps: {
      path: CASINO_SLOTS_LINK,
    },
    active: checkIfActive(location, CASINO_SLOTS_LINK),
  },
  {
    key: 'bonusBuy',
    icon: BonusBuys,
    text: translate('navbar.bonusBuys'),
    buttonProps: {
      path: GAME_TAG_BONUS_BUYS_LINK,
    },
    active: checkIfActive(location, GAME_TAG_BONUS_BUYS_LINK),
  },
  {
    key: 'liveCasino',
    icon: LiveCasino,
    text: translate('navbar.liveCasino'),
    buttonProps: {
      path: CASINO_LIVE_CASINO_LINK,
    },
    active: checkIfActive(location, CASINO_LIVE_CASINO_LINK),
  },
  {
    key: 'gameShows',
    icon: GameShows,
    text: translate('navbar.gameShows'),
    buttonProps: {
      path: CASINO_GAME_SHOWS_LINK,
    },
    active: checkIfActive(location, CASINO_GAME_SHOWS_LINK),
  },
  {
    key: 'roulette',
    icon: Roulette,
    text: translate('navbar.roulette'),
    buttonProps: {
      path: GAME_TAG_ROULETTE_LINK,
    },
    active: checkIfActive(location, GAME_TAG_ROULETTE_LINK),
  },
  {
    key: 'blackjack',
    icon: Blackjack,
    text: translate('navbar.blackjack'),
    buttonProps: {
      path: GAME_TAG_BLACKJACK_LINK,
    },
    active: checkIfActive(location, GAME_TAG_BLACKJACK_LINK),
  },
  {
    key: 'baccarat',
    icon: Baccarat,
    text: translate('navbar.baccarat'),
    buttonProps: {
      path: GAME_TAG_BACCARAT_LINK,
    },
    active: checkIfActive(location, GAME_TAG_BACCARAT_LINK),
  },
]

export const getSportsbookItems = (
  translate: TFunction<'translation', undefined>,
  location,
) => [
  // {
  //   key: 'live',
  //   icon: Sportsbook, // TODO: Need the Live Icon
  //   text: translate('navbar.live'),
  //   buttonProps: {
  //
  // path: `/sports${liveSearchLink}`,
  //
  //   },
  // active: location.search === liveSearchLink,
  // },
  {
    key: 'soccer',
    icon: Sportsbook,
    text: translate('navbar.soccer'),
    buttonProps: {
      path: `/sports${soccerSearchLink}`,
    },
    active: location.search === soccerSearchLink,
  },
  {
    key: 'basketball',
    icon: Basketball,
    text: translate('navbar.basketball'),
    buttonProps: {
      path: `/sports${basketballSearchLink}`,
    },
    active: location.search === basketballSearchLink,
  },
  {
    key: 'tennis',
    icon: Tennis,
    text: translate('navbar.tennis'),
    buttonProps: {
      path: `/sports${tennisSearchLink}`,
    },
    active: location.search === tennisSearchLink,
  },
  {
    key: 'counterStrike',
    icon: CounterStrike,
    text: translate('navbar.counterStrike'),
    buttonProps: {
      path: `/sports${counterStrikeSearchLink}`,
    },
    active: location.search === counterStrikeSearchLink,
  },
  {
    key: 'fifa',
    icon: Fifa,
    text: translate('navbar.fifa'),
    buttonProps: {
      path: `/sports${fifaSearchLink}`,
    },
    active: location.search === fifaSearchLink,
  },
  {
    key: 'baseball',
    icon: Baseball,
    text: translate('navbar.baseball'),
    buttonProps: {
      path: `/sports${baseballSearchLink}`,
    },
    active: location.search === baseballSearchLink,
  },
  {
    key: 'iceHockey',
    icon: IceHockey,
    text: translate('navbar.iceHockey'),
    buttonProps: {
      path: `/sports${iceHockeySearchLink}`,
    },
    active: location.search === iceHockeySearchLink,
  },
  {
    key: 'cricket',
    icon: Cricket,
    text: translate('navbar.cricket'),
    buttonProps: {
      path: `/sports${cricketSearchLink}`,
    },
    active: location.search === cricketSearchLink,
  },
  {
    key: 'mma',
    icon: MMA,
    text: translate('navbar.mma'),
    buttonProps: {
      path: `/sports${mmaSearchLink}`,
    },
    active: location.search === mmaSearchLink,
  },
  {
    key: 'tableTennis',
    icon: TableTennis,
    text: translate('navbar.tableTennis'),
    buttonProps: {
      path: `/sports${tableTennisSearchLink}`,
    },
    active: location.search === tableTennisSearchLink,
  },
]

export const getLocalizationItems = (
  onLanguageChange: (locale: any) => Promise<void>,
  activeCode: string,
  onAccordionItemClick: (() => void) | undefined,
) =>
  localizations.map(locale => {
    return {
      key: locale.code,
      text: locale.lang,
      buttonProps: {
        onClick: () => {
          if (onAccordionItemClick) {
            onAccordionItemClick()
          }
          onLanguageChange(locale.code)
        },
      },
      active: activeCode === locale.code,
    }
  })

export const tooltipMessage = (text: string) => (
  <Typography variant="body4" fontWeight={uiTheme.typography.fontWeightBold}>
    {text}
  </Typography>
)
