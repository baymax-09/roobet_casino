import gql from 'graphql-tag'

const UserRaffleEntriesFragment = gql`
  fragment RaffleEntries on User {
    raffleEntries {
      id
      name
      tickets
    }
  }
`

export const CreditRaffleTicketsMutation = gql`
  ${UserRaffleEntriesFragment}
  mutation CreditRaffleTickets($raffleId: ID!, $userId: ID!, $amount: Int!) {
    creditRaffleTickets(raffleId: $raffleId, userId: $userId, amount: $amount) {
      id
      ...RaffleEntries
    }
  }
`

export const UserQuery = gql`
  ${UserRaffleEntriesFragment}
  query User($userId: UUID!) {
    user(userId: $userId) {
      id
      ...RaffleEntries
    }
  }
`

export * from './apolloClient'
export * from './tpGameBlock'
export * from './messaging'
export * from './slotPotato'
export * from './gameTags'
export * from './tpGames'
export * from './inventory'
export * from './questTemplates'
export * from './kyc'
export * from './quests'
export * from './raffles'
export * from './bonusCodes'
export * from './withdrawals'
