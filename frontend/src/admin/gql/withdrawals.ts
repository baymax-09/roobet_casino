import gql from 'graphql-tag'

const FlaggedWithdrawalFragment = gql`
  fragment FlaggedWithdrawalFragment on Withdrawal {
    id
    createdAt
    reason
    totalValue
    user {
      id
      name
      role
      createdAt
      lifetimeValue
      numFlaggedWithdrawals
    }
  }
`

export const FlaggedWithdrawalsQuery = gql`
  ${FlaggedWithdrawalFragment}
  query FlaggedWithdrawals {
    flaggedWithdrawalsQuery {
      ...FlaggedWithdrawalFragment
    }
  }
`

export const ApproveFlaggedWithdrawalMutation = gql`
  ${FlaggedWithdrawalFragment}
  mutation ApproveFlaggedWithdrawal($data: HandleWithdrawalInput!) {
    approveFlaggedWithdrawal(data: $data) {
      ...FlaggedWithdrawalFragment
    }
  }
`

export const RejectFlaggedWithdrawalMutation = gql`
  ${FlaggedWithdrawalFragment}
  mutation RejectFlaggedWithdrawal($data: HandleWithdrawalInput!) {
    rejectFlaggedWithdrawal(data: $data) {
      ...FlaggedWithdrawalFragment
    }
  }
`

export const FlaggedWithdrawalCreatedSubscription = gql`
  ${FlaggedWithdrawalFragment}
  subscription FlaggedWithdrawalCreatedSubscription {
    flaggedWithdrawalCreated {
      ...FlaggedWithdrawalFragment
    }
  }
`

export interface FlaggedWithdrawalMutationVariables {
  id: string
  note?: string
}

export interface FlaggedWithdrawalQueryData {
  id: string
  createdAt: string
  reason: string
  totalValue: number
  user: {
    id: string
    name: string
    role: string
    createdAt: string
    lifetimeValue: number
    numFlaggedWithdrawals: number
  }
}

export interface FlaggedWithdrawalMutationData {
  rejectFlaggedWithdrawal: {
    id: string
  }
}
