import React from 'react'
import { useMutation } from '@apollo/client'
import { useHistory } from 'react-router-dom'

import { GameTagsNotCachedQuery, GameTagCreateMutation } from 'admin/gql'
import { useToasts } from 'common/hooks'

import { GameTagsTemplateForm } from '../..'
import { DEFAULT_TAG } from '../GameTagsListRoute/GameTagsRoute'

export const GameTagsCreateRoute: React.FC = () => {
  const history = useHistory()
  const { toast } = useToasts()

  const [gameTagCreateMutation, { loading: createLoading }] = useMutation(
    GameTagCreateMutation,
    {
      update(cache, { data }) {
        const newGameTag = data?.gameTagCreate
        const existingGameTags = cache.readQuery<{
          gameTagsNotCached: unknown[]
        }>({
          query: GameTagsNotCachedQuery,
        })

        cache.writeQuery({
          query: GameTagsNotCachedQuery,
          data: {
            gameTagsNotCached: [
              ...(existingGameTags?.gameTagsNotCached ?? []),
              newGameTag,
            ],
          },
        })
      },
      onError: error => {
        toast.error(error.message)
      },
    },
  )

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

    if (!id) {
      await gameTagCreateMutation({
        variables: {
          data: {
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
      toast.success(`Successfully created ${title}`)
      history.push('/games/games-manager/?tab=Tags')
    }
  }

  return (
    <GameTagsTemplateForm
      title="Create Game Tag"
      initialValues={DEFAULT_TAG}
      onSubmit={onSubmit}
      loading={createLoading}
    />
  )
}
