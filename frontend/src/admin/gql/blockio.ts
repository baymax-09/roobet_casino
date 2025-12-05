import gql from 'graphql-tag'

export const BlockioCurrentBlockQuery = gql`
  query BlockioCurrentBlock($crypto: String!) {
    blockioCurrentBlock(crypto: $crypto) {
      height
    }
  }
`

export const BlockioUpdateTransactionMutation = gql`
  mutation BlockioUpdateTransaction($data: BlockioUpdateTransactionInput!) {
    blockioUpdateTransaction(data: $data) {
      success
    }
  }
`
