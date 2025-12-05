import i18next from 'i18next'

import { type GameTag } from 'common/types'

export const gamesPerPage = 56
export interface GameTagConfiguration {
  title: string
  showImFeelingLucky?: boolean
  path: string
  pageSize?: number
  options: {
    group?: string
    includeRecommendedSort?: boolean
    kothPage?: string
    tagSlug?: string
  }
}

export interface GameTagOverrides {
  pageSize?: number
}

export const applyGameTagOverrides = (
  tag: GameTag,
  lang: string,
): GameTagConfiguration => {
  return {
    title: getGameTagTitle(tag.slug, lang, tag.title),
    path: tag.slug,
    pageSize: tag.pageSize,
    options: {
      group: tag.slug,
      tagSlug: tag.slug,
      includeRecommendedSort: true,
    },
  }
}

/**
 * Get a hard-coded translation for a given game tag slug. If the slug
 * changes in the DB, these translations will no longer work. If a slug is
 * in the DB but missing here, the translation will also not work.
 */
export const getGameTagTitle = (
  slug: string,
  lng: string,
  fallback?: string,
): string => {
  switch (slug) {
    case 'slots':
      return i18next.t('gameList.slots', { lng })

    case 'bonus-buys':
      return i18next.t('gameList.bonus-buys', { lng })

    case 'megaways':
      return i18next.t('gameList.megaways', { lng })

    case 'popular':
      return i18next.t('gameList.popular', { lng })

    case 'top-picks':
      return i18next.t('gameList.topPicks', { lng })

    case 'gameshows':
      return i18next.t('gameList.gameShows', { lng })

    case 'roobet-games':
      return i18next.t('gameList.housegames', { lng })

    case 'blackjack':
      return i18next.t('gameList.blackjack', { lng })

    case 'baccarat':
      return i18next.t('gameList.baccarat', { lng })

    case 'dropsandwins':
      return i18next.t('gameList.dropsandwins', { lng })

    case 'saint-patricks-parade':
      return i18next.t('gameList.stpaddys', { lng })

    case 'favorites':
      return i18next.t('gameList.favorites', { lng })

    case 'livegames':
      return i18next.t('gameList.livegames', { lng })

    case 'spin-to-win':
      return i18next.t('gameList.taketheprize', { lng })

    case 'rock-roll-reunion':
      return i18next.t('gameList.rock-roll-reunion', { lng })

    case 'take-the-prize':
      return i18next.t('gameList.take-the-prize', { lng })

    case "roo's-lounge":
      return i18next.t("gameList.roo's-lounge", { lng })

    case 'play-n-win':
      return i18next.t('gameList.play-n-win', { lng })

    case 'roulette':
      return i18next.t('gameList.roulette', { lng })

    case 'dungeon-quest':
      return i18next.t('gameList.dungeon-quest', { lng })

    case 'live-casino-picks':
      return i18next.t('gameList.live-casino-picks', { lng })

    case 'live-dropsandwins':
      return i18next.t('gameList.live-dropsandwins', { lng })

    case 'live-poker':
      return i18next.t('gameList.live-poker', { lng })

    case 'slots-tourney':
      return i18next.t('gameList.slots-tourney', { lng })

    case 'slots-cash-drops':
      return i18next.t('gameList.slots-cash-drops', { lng })

    case 'bonanza-party':
      return i18next.t('gameList.bonanza-party', { lng })

    case 'wonders-of-egypt':
      return i18next.t('gameList.wonders-of-egypt', { lng })

    case 'harvest-of-bets':
      return i18next.t('gameList.harvest-of-bets', { lng })

    case 'pragmatic-tournament':
      return i18next.t('gameList.pragmatic-tournament', { lng })

    case 'halloween-haunting':
      return i18next.t('gameList.halloween-haunting', { lng })

    case 'haunted-party':
      return i18next.t('gameList.haunted-party', { lng })

    case 'scratchcards':
      return i18next.t('gameList.scratchcards', { lng })
  }

  // Unknown translation, return default or slug slug.
  return fallback ?? slug
}
