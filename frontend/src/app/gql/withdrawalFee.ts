import gql from 'graphql-tag'

export const WithdrawalFeeQuery = gql`
  query WithdrawalFee($crypto: String!) {
    withdrawalFee(crypto: $crypto) {
      id
      fee
    }
  }
`

export interface WithdrawalFeeQueryData {
  withdrawalFee: {
    id: string // the crypto token
    fee: number
  }
}

export interface WithdrawalFeeQueryVariables {
  crypto: string
}
