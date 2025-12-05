import gql from 'graphql-tag'

export const QuestsACPQuery = gql`
  query QuestsACPQuery(
    $criteriaType: String
    $completed: Boolean
    $userId: String
  ) {
    questsACP(
      criteriaType: $criteriaType
      completed: $completed
      userId: $userId
    ) {
      criteriaType
      userId
      name
      completed
      progress
      userWageredAmountUSD
    }
  }
`
