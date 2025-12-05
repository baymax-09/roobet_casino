import gql from 'graphql-tag'

import { type BlockedGamesChunk } from 'common/types'

export const TPGamesBlocksQuery = gql`
  query TPGamesBlocked {
    tpGameBlocks {
      id
      key
      value
    }
  }
`

export interface BlockedGamesQueryData {
  tpGameBlocks: BlockedGamesChunk[]
}

export const EnableTPGameMutation = gql`
  mutation EnableTPGameMutation($id: ID!) {
    enableTPGameMutation(id: $id) {
      id
      key
      value
    }
  }
`

export interface EnableGameMutationData {
  enableTPGameMutation: BlockedGamesChunk
}

export const BlockTPGameMutation = gql`
  mutation BlockTPGameMutation($data: BlockTPGameInput!) {
    blockTPGameMutation(data: $data) {
      id
      key
      value
    }
  }
`

export interface BlockGameMutationData {
  blockTPGameMutation: BlockedGamesChunk
}
