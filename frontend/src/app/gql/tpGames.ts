import { gql } from 'graphql-tag'
import { type TypedDocumentNode } from '@apollo/client'

import { type TPGame } from 'common/types'
import { type DisplayCurrency } from 'common/constants'

export interface TPGamesData {
  tpGames: TPGame[]
}

export interface TPGameData {
  tpGame: TPGame
}

export interface TPGameQueryVariables {
  gameIdentifier: string
  type?: 'desktop' | 'mobile'
}

export interface TPGameStartGameData {
  tpGameStartGame: {
    url: string | null
    token: string | null
    partnerId: string | null
    supportedCurrencies: DisplayCurrency[]
  }
}

export interface TPGameStartGameVariables {
  gameIdentifier: string
  mode?: 'demo' | 'live'
  gameCurrency?: string
}

export const TPGameEssentialsFragment = gql`
  fragment TPGameEssentialsFragment on TPGame {
    id
    devices
    aggregator
    category
    identifier
    provider
    title
    popularity
    squareImage
    releasedAt
    tagPriorities
    tags {
      id
      slug
    }
  }
`

export const TPGamesGetAllProductQuery = gql`
  query TPGamesGetAllProductQuery {
    tpGamesGetAll {
      ...TPGameEssentialsFragment
    }
  }
  ${TPGameEssentialsFragment}
`

export const TPGameFragment = gql`
  fragment TPGameFragment on TPGame {
    id
    title
    identifier
    provider
    blacklist
    tagIds
    hasFunMode
    category
    popularity
    gid
    squareImage
    releasedAt
    aggregator
    iframeSubdomain
  }
`

const TPGameFeelingLuckyFragment: TypedDocumentNode<Partial<TPGame>> = gql`
  fragment TPGameFeelingLuckyFragment on TPGame {
    identifier
  }
`

export const TPGameStartGameMutation = gql`
  mutation StartGame(
    $gameIdentifier: ID!
    $mode: GameMode
    $gameCurrency: String
  ) {
    tpGameStartGame(
      gameIdentifier: $gameIdentifier
      mode: $mode
      gameCurrency: $gameCurrency
    ) {
      url
      token
      partnerId
      supportedCurrencies
    }
  }
`

export const TPGameQuery = gql`
  query TPGame4($gameIdentifier: String!, $type: String) {
    tpGame(gameIdentifier: $gameIdentifier, type: $type) {
      ...TPGameFragment
      tags {
        id
        slug
        title
        excludeFromTags
      }
    }
  }
  ${TPGameFragment}
`

export const TPGamesFeelingLuckyQuery = gql`
  query TPGamesFeelingLuckyQuery($device: String) {
    tpGames(device: $device, samples: 1, limit: 1, page: 0) {
      ...TPGameFeelingLuckyFragment
    }
  }
  ${TPGameFeelingLuckyFragment}
`

export interface GameToggleFavoriteMutationVariables {
  gameIdentifier: string
  isFavorite: boolean
}

export interface GameToggleFavoriteMutationData {
  gameToggleFavorite: {
    user: {
      __typename: 'User'
      id: string
      favoriteGames: Array<TPGame & { __typename: 'TPGame' }>
    }
  }
}

export const GameToggleFavoriteMutation = gql`
  mutation GameToggleFavorite($gameIdentifier: String!, $isFavorite: Boolean!) {
    gameToggleFavorite(
      gameIdentifier: $gameIdentifier
      isFavorite: $isFavorite
    ) {
      user {
        id
        favoriteGames {
          ...TPGameFragment
        }
      }
    }
  }
  ${TPGameFragment}
`
