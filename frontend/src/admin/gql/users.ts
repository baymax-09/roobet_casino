import gql from 'graphql-tag'

const UserFragment = gql`
  fragment BaseUser on User {
    id
    isStaff
    name
    email
    nameLowercase
    roles
  }
`

export const UsersQuery = gql`
  ${UserFragment}
  query Users($isStaff: Boolean) {
    users(isStaff: $isStaff) {
      ...BaseUser
    }
  }
`
