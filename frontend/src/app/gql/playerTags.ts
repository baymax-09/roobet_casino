import gql from 'graphql-tag'

export const CreatePlayerTagMutation = gql`
  mutation playerTagCreate($data: PlayerTagCreateInput!) {
    playerTagCreate(data: $data) {
      tagId
      createdAt
      updatedAt
    }
  }
`
