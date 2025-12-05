import gql from 'graphql-tag'

export const QuestsTemplatesQuery = gql`
  query QuestsTemplatesQuery {
    questTemplates {
      id
      name
      rewardId
      criteriaType
      criteriaSettings {
        ... on PageViewQuestSettings {
          urlPattern
        }
        ... on NewPlayerIncentiveQuestSettings {
          wageredAmountUSD
        }
      }
    }
  }
`

export const QuestsTemplateCreateMutation = gql`
  mutation QuestsTemplateCreate($data: QuestTemplateCreateInput!) {
    questTemplateCreate(data: $data) {
      id
      name
      rewardId
      criteriaType
      criteriaSettings {
        ... on PageViewQuestSettings {
          urlPattern
        }
        ... on NewPlayerIncentiveQuestSettings {
          wageredAmountUSD
        }
      }
    }
  }
`
