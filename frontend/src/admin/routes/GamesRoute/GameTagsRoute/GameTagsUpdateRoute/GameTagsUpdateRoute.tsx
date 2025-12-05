import React from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useHistory } from 'react-router-dom'

import { GameTagsNotCachedQuery, GameTagUpdateMutation } from 'admin/gql'
import { Loading } from 'mrooi'
import { useToasts } from 'common/hooks'
import { withRulesAccessController } from 'admin/components'

import { GameTagsTemplateForm } from '../..'

const UpdateGameTagForm = withRulesAccessController(
  ['tpgametags:update'],
  GameTagsTemplateForm,
)

interface GameTagsUpdateRouteProps {
  match: {
    params: {
      id: string
    }
  }
}

export const GameTagsUpdateRoute: React.FC<GameTagsUpdateRouteProps> = ({
  match,
}) => {
  const history = useHistory()
  const { toast } = useToasts()

  const { id } = match.params

  const { data: tagResponse } = useQuery(GameTagsNotCachedQuery, {
    onError: error => {
      toast.error(error.message)
    },
  })

  const [gameTagUpdateMutation, { loading: updateLoading }] = useMutation(
    GameTagUpdateMutation,
    {
      update(cache, { data }) {
        const newGameTag = data?.gameTagUpdate
        const existingGameTags = cache.readQuery<{
          gameTagsNotCached: Array<{ id: string }>
        }>({
          query: GameTagsNotCachedQuery,
        })
        cache.writeQuery({
          query: GameTagsNotCachedQuery,
          data: {
            gameTagsNotCached:
              existingGameTags?.gameTagsNotCached.map(game => {
                if (game.id === newGameTag.id) {
                  return newGameTag
                }
                return game
              }) ?? [],
          },
        })
      },
      onError: error => {
        toast.error(error.message)
      },
    },
  )

  const data = tagResponse?.gameTagsNotCached || []

  const currentGameTag = data.find(tag => tag.id === id)

  const onSubmit = async (values, { setErrors }) => {
    const {
      slug,
      title,
      games,
      id,
      excludeFromTags,
      enabled,
      startDate,
      endDate,
      order,
      pageSize,
      showOnHomepage,
    } = values
    const gameIds = games.map(game => game.id)

    // TODO this should technically be a record of each form field to string
    const errors: Record<string, string> = {}
    if (!title.length) {
      errors.title = 'Must specify a title'
    }

    if (!slug.length) {
      errors.slug = 'Must specify a slug'
    }

    if (Object.keys(errors).length > 0) {
      return setErrors(errors)
    }

    if (id) {
      await gameTagUpdateMutation({
        variables: {
          data: {
            id,
            title,
            slug,
            gameIds,
            excludeFromTags,
            enabled,
            startDate,
            endDate,
            order,
            pageSize,
            showOnHomepage,
          },
        },
      })
      toast.success(`Successfully updated ${title}`)
      history.push('/games/games-manager/?tab=Tags')
    }
  }

  if (!currentGameTag) {
    return <Loading />
  }

  return (
    <UpdateGameTagForm
      title="Update Game Tag"
      initialValues={currentGameTag}
      onSubmit={onSubmit}
      loading={updateLoading}
    />
  )
}
