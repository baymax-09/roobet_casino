import gql from 'graphql-tag'

export const GameTagCreateMutation = gql`
  mutation GameTagCreateMutation($data: GameTagCreateInput!) {
    gameTagCreate(data: $data) {
      id
      title
      slug
      excludeFromTags
      enabled
      endDate
      startDate
      order
      pageSize
      games {
        id
        identifier
      }
      showOnHomepage
    }
  }
`

export const GameTagUpdateMutation = gql`
  mutation GameTagUpdateMutation($data: GameTagUpdateInput!) {
    gameTagUpdate(data: $data) {
      id
      title
      slug
      excludeFromTags
      enabled
      endDate
      startDate
      order
      pageSize
      games {
        id
        identifier
      }
      showOnHomepage
    }
  }
`

export const GameTagDeleteMutation = gql`
  mutation GameTagDeleteMutation($id: ID!) {
    gameTagDelete(id: $id) {
      id
    }
  }
`

export const GameTagsNotCachedQuery = gql`
  query GameTagsNotCached {
    gameTagsNotCached {
      id
      title
      slug
      excludeFromTags
      enabled
      startDate
      endDate
      order
      pageSize
      games {
        id
        identifier
      }
      showOnHomepage
    }
  }
`

export const GameTagUpdateOrderMutation = gql`
  mutation GameTagUpdateOrderMutation($data: [GameTagUpdateInput!]!) {
    gameTagUpdateOrder(data: $data) {
      id
      title
      slug
      enabled
      excludeFromTags
      endDate
      startDate
      order
      pageSize
      order
      games {
        id
        identifier
      }
      showOnHomepage
    }
  }
`
