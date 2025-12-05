import gql from 'graphql-tag'

export const RedrawRaffleWinner = gql`
  mutation RedrawRaffleWinner($raffleId: ID!, $userId: ID!) {
    redrawRaffleWinner(raffleId: $raffleId, userId: $userId) {
      id
    }
  }
`
