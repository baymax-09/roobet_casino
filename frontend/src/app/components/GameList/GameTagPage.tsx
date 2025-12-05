import React from 'react'

import { gamesPerPage } from 'app/constants'
import { useTranslate } from 'app/hooks'

import GameTagView from './GameTagView'
import ApolloCacheGameList from './ApolloCacheGameList'

interface GameListPageProps {
  list: {
    title?: string
    showImFeelingLucky?: boolean
    path: string
    pageSize?: number
    logo?: string
    options: {
      group?: string
      includeRecommendedSort?: boolean
      kothPage?: string
      tagSlug?: string
    }
  }
}

const GameTagPage: React.FC<GameListPageProps> = ({ list }) => {
  const {
    showImFeelingLucky,
    options: { tagSlug, includeRecommendedSort },
  } = list

  const translate = useTranslate()

  // We don't want to show something like "Roobet Games Games"

  const searchText = React.useMemo(() => {
    const appendGamesToSearchText = !list.title?.toLowerCase().includes('games')

    if (list.title) {
      return translate(
        appendGamesToSearchText
          ? 'gameList.tagWithGamesSearch'
          : 'gameList.providerSearch',
        {
          provider: list.title,
        },
      )
    }
    return translate('gameList.searchGames')
  }, [list.title])

  return (
    <GameTagView list={list}>
      <ApolloCacheGameList
        tags={tagSlug}
        gamesFilter={{ ...(tagSlug && { tagSlugs: [tagSlug] }) }}
        pageSize={gamesPerPage}
        showImFeelingLucky={!!showImFeelingLucky}
        useGameListCollateProps={{
          includeRecommendedSort: false,
          searchProps: {
            // t('gameList.tagWithGamesSearch')
            searchText,
          },
        }}
      />
    </GameTagView>
  )
}

export default React.memo(GameTagPage)
