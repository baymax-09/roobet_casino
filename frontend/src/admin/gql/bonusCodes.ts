import gql from 'graphql-tag'

const BonusCodesFragment = gql`
  fragment BonusCode on BonusCode {
    id
    name
    type
    description
    typeSettings {
      ... on FreeSpinsTypeSettings {
        amount
        rounds
        gameIdentifier
        tpGameAggregator
      }
    }
  }
`
export const BonusCodesGetAllQuery = gql`
  ${BonusCodesFragment}
  query BonusCodesGetAll {
    bonusCodes {
      ...BonusCode
    }
  }
`

export const BonusCodesGetByIdQuery = gql`
  ${BonusCodesFragment}
  query BonusCodeById($id: ID!) {
    bonusCodeById(id: $id) {
      ...BonusCode
    }
  }
`

export const BonusCodeCreateMutation = gql`
  ${BonusCodesFragment}
  mutation BonusCodeCreate($data: BonusCodeCreateInput!) {
    bonusCodeCreate(data: $data) {
      ...BonusCode
    }
  }
`

export const BonusCodeDeleteMutation = gql`
  ${BonusCodesFragment}
  mutation BonusCodeDelete($data: BonusCodeDeleteInput!) {
    bonusCodeDelete(data: $data) {
      ...BonusCode
    }
  }
`

export const BonusCodeUpdateMutation = gql`
  ${BonusCodesFragment}
  mutation BonusCodeUpdate($data: BonusCodeUpdateInput!) {
    bonusCodeUpdate(data: $data) {
      ...BonusCode
    }
  }
`
