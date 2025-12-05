import React from 'react'
import { useHistory } from 'react-router-dom'
import { useQuery } from '@apollo/client'

import { gamesPerPage, getGameTagTitle } from 'app/constants'
import { GameTagPage } from 'app/components/GameList'
import { useLocale } from 'app/hooks'
import { GameTagsQuery } from 'app/gql'
import { type GameTagsResults } from 'common/types'
/**
 * Preset list of games to display on homepage, and options to render full page list.
 */
export const GameTagRoute = props => {
  const { path } = props.match.params

  const history = useHistory()
  const lang = useLocale()

  const { data, loading } = useQuery<GameTagsResults>(GameTagsQuery)

  const tagConfig = data?.gameTags.find(config => config.slug === path)

  const list = {
    path,
    pageSize: gamesPerPage,
    title: tagConfig
      ? getGameTagTitle(tagConfig?.slug, lang, tagConfig?.title)
      : undefined,
    options: {
      group: path,
      tagSlug: path,
      includeRecommendedSort: true,
    },
  }

  if (!loading && !tagConfig) {
    // Redirect home.
    history.replace('/')
    return undefined
  }

  return <GameTagPage list={list} />
}
