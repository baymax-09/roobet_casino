import gql from 'graphql-tag'

import { type TPGame } from 'common/types'

export interface UpdateTPGameResponse {
  updateTPGame: Partial<TPGame>
}

export interface UpdateTPGameCategoriesResponse {
  boolean: boolean
}

const AdminTPGameFragment = gql`
  fragment AdminTPGameFragment on TPGameAdmin {
    id
    title
    identifier
    hasFunMode
    approvalStatus
    provider
    devices
    blacklist
    tagIds
    category
    description
    popularity
    gid
    squareImage
    releasedAt
    aggregator
    iframeSubdomain
    payout
    category
  }
`
const UpdateTPGameFragment = gql`
  fragment UpdateTPGameFragment on TPGameAdmin {
    id
  }
`

export interface TPGamesQueryData {
  tpGamesAdmin: Array<{
    id: string
    title: string
    provider: string
  }>
}

export const TPGamesQuery = gql`
  query TPGamesSlots {
    tpGamesAdmin(category: "slots", ascending: true) {
      id
      title
      provider
    }
  }
`
export const TPGamesGetAllQuery = gql`
  query TPGamesGetAllQuery($approvalStatus: String, $disabledGames: Boolean) {
    tpGamesGetAll(
      approvalStatus: $approvalStatus
      disabledGames: $disabledGames
    ) {
      id
      title
      identifier
    }
  }
`

export const TPGamesByAggregator = gql`
  query GamesByAggregator($aggregator: String!) {
    tpGamesByAggregator(aggregator: $aggregator) {
      id
      gid
      identifier
    }
  }
`

export interface TPGamesProviderNamesData {
  tpGamesProviderNames: string[]
}

export const TPGamesProviderNames = gql`
  query TPGamesProviderNames {
    tpGamesProviderNames
  }
`

export interface AdminTPGameData {
  tpGameAdmin: TPGame
}

export const AdminTPGameQuery = gql`
  ${AdminTPGameFragment}
  query TPGame3($gameIdentifier: String!, $type: String) {
    tpGameAdmin(gameIdentifier: $gameIdentifier, type: $type) {
      ...AdminTPGameFragment
    }
  }
`

export const TPGameUpdate = gql`
  ${UpdateTPGameFragment}
  mutation TPGameUpdate(
    $gameIdentifier: String!
    $input: UpdateTPGameInputType!
  ) {
    updateTPGame(gameIdentifier: $gameIdentifier, input: $input) {
      ...UpdateTPGameFragment
    }
  }
`

export const TPGameCategoryUpdate = gql`
  mutation tpGameCategoryUpdate($input: TPGameCategoryUpdateInput!) {
    tpGameCategoryUpdate(input: $input)
  }
`

export const TPGameMetadataQuery = gql`
  query tpGameMetadata {
    tpGameMetadata {
      categories
      aggregators
      providers
    }
  }
`

export const TPGameStatusUpdate = gql`
  mutation updateTpGameStatus($input: TPGameStatusUpdateInputType!) {
    updateTpGameStatus(input: $input)
  }
`

export const TPGameAdminPaginatedQuery = gql`
  ${AdminTPGameFragment}
  query tpGamesAdminPaginated(
    $limit: Int
    $page: Int
    $filterObj: GamesFilter
  ) {
    tpGamesAdminPaginated(limit: $limit, page: $page, filterObj: $filterObj) {
      limit
      page
      count
      data {
        ...AdminTPGameFragment
      }
    }
  }
`
