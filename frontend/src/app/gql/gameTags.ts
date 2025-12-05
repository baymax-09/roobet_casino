import gql from 'graphql-tag'

// TODO: Rewrite this to use TPGameEssentialsFragment
export const GameTagsQuery = gql`
  query GameTags {
    gameTags {
      id
      title
      slug
      pageSize
      showOnHomepage
    }
  }
`
