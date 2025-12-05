import gql from 'graphql-tag'

export const ResetKYCLevelMutation = gql`
  mutation ResetKYCLevel($data: ResetKYCLevelInput!) {
    resetKYCLevel(data: $data) {
      userId
    }
  }
`
