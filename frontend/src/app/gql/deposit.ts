import gql from 'graphql-tag'
import { type TypedDocumentNode } from '@apollo/client'

import {
  type RippleDepositInfo,
  type TronUserWalletInfo,
} from '../../common/types'

export const RippleDestinationTagFragment: TypedDocumentNode<RippleDepositInfo> = gql`
  fragment RippleDestinationTagFragment on User {
    rippleDestinationTag {
      id
      type
      destinationTag
      destinationAddress
    }
  }
`

export const TronUserWalletFragment: TypedDocumentNode<TronUserWalletInfo> = gql`
  fragment TronUserWalletFragment on User {
    tronUserWallet {
      id
      type
      nonce
      userId
      address
    }
  }
`
