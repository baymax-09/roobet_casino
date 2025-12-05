import { gql } from '@apollo/client'

export const betActivityQuery = gql`
  query PlayerBetActivity(
    $userId: String!
    $startDate: String!
    $endDate: String!
  ) {
    playerBetActivity(
      userId: $userId
      startDate: $startDate
      endDate: $endDate
    ) {
      title
      gameName
      identifier
      wagers
      wagered
      avgWager
      payout
      ggr
    }
  }
`
