import { gql } from 'graphql-tag'
import { type TypedDocumentNode } from '@apollo/client'

import { type TPGame, type User } from 'common/types'

import { RippleDestinationTagFragment, TronUserWalletFragment } from './deposit'
import { TPGameFragment } from './tpGames'

export interface CurrentUserFavoriteGamesQueryData {
  currentUser: {
    // __typename is required for cache updates
    __typename: 'User'
    id: string
    favoriteGames: Array<TPGame & { __typename: 'TPGame' }>
  }
}

export interface CurrentUserRecentGamesQueryData {
  currentUser: {
    recentGames: TPGame[]
  }
}

const CurrentUserFavoriteGamesFragment: TypedDocumentNode<Partial<User>> = gql`
  fragment CurrentUserFavoriteGamesFragment on User {
    favoriteGames {
      ...TPGameFragment
      devices
      createdAt
    }
  }
  ${TPGameFragment}
`
const CurrentUserRecentGamesFragment: TypedDocumentNode<Partial<User>> = gql`
  fragment CurrentUserRecentGamesFragment on User {
    recentGames {
      ...TPGameFragment
    }
  }
  ${TPGameFragment}
`

export const CurrentUserCryptoDepositQuery = gql`
  query CurrentUserDeposit {
    currentUser {
      id
      ...RippleDestinationTagFragment
    }
  }
  ${RippleDestinationTagFragment}
`

export const CurrentUserTronWalletQuery = gql`
  query TronUserWallet {
    currentUser {
      id
      ...TronUserWalletFragment
    }
  }
  ${TronUserWalletFragment}
`

export const CurrentUserFavoriteGamesQuery = gql`
  query CurrentUser2 {
    currentUser {
      id
      ...CurrentUserFavoriteGamesFragment
    }
  }
  ${CurrentUserFavoriteGamesFragment}
`
export const CurrentUserRecentGamesQuery = gql`
  query CurrentUser3 {
    currentUser {
      ...CurrentUserRecentGamesFragment
    }
  }
  ${CurrentUserRecentGamesFragment}
`
