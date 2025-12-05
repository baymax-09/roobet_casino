import gql from 'graphql-tag'

const SlotPotatoFragment = gql`
  fragment SlotPotatoFragment on SlotPotato {
    games {
      order
      game {
        title
        id
      }
    }
    id
    startDateTime
    endDateTime
    gameDuration
    disabled
    isActive
  }
`

export const SlotPotatoCreateMutation = gql`
  ${SlotPotatoFragment}
  mutation SlotPotatoCreate($data: SlotPotatoCreateInput!) {
    slotPotatoCreate(data: $data) {
      ...SlotPotatoFragment
    }
  }
`
export const SlotPotatoUpdateMutation = gql`
  ${SlotPotatoFragment}
  mutation SlotPotatoUpdate($data: SlotPotatoUpdateInput!) {
    slotPotatoUpdate(data: $data) {
      ...SlotPotatoFragment
    }
  }
`

export const SlotPotatoEnableMutation = gql`
  ${SlotPotatoFragment}
  mutation SlotPotatoEnable($data: SlotPotatoEnableInput!) {
    slotPotatoEnable(data: $data) {
      ...SlotPotatoFragment
    }
  }
`

export const SlotPotatoDisableMutation = gql`
  ${SlotPotatoFragment}
  mutation SlotPotatoDisable($data: SlotPotatoDisableInput!) {
    slotPotatoDisable(data: $data) {
      ...SlotPotatoFragment
    }
  }
`

export const SlotPotatoQuery = gql`
  ${SlotPotatoFragment}
  query SlotPotato($id: [ID!]) {
    slotPotatoes(ids: $id) {
      ...SlotPotatoFragment
    }
  }
`
export interface SlotPotatoGame {
  order: number
  game: {
    title: string
    id: string
  }
}

export interface SlotPotato {
  games: SlotPotatoGame[]
  id: string
  gameDuration: number
  disabled: boolean
  isActive: boolean

  /** Date in ISO String */
  startDateTime: string
  endDateTime: string
}

export interface SlotPotatoQueryResponse {
  slotPotatoes: SlotPotato[]
}
