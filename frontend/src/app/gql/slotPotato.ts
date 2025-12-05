import gql from 'graphql-tag'

export const SlotPotatoActiveQuery = gql`
  query SlotPotatoActive {
    slotPotatoActive {
      games {
        order
        startDateTime
        endDateTime
        game {
          id
          title
          identifier
          squareImage
        }
      }
      id
      startDateTime
      endDateTime
      gameDuration
      disabled
      activeGame {
        gameId
      }
    }
  }
`

export interface SlotGame {
  id: string
  title: string
  identifier: string
  squareImage: RoobetAssetPath<AssetType>
}

export interface SlotPotatoGame {
  order: number
  startDateTime: Date
  endDateTime: Date
  game: SlotGame
}

export interface SlotPotato {
  games: SlotPotatoGame[]
  id: string
  startDateTime: Date
  endDateTime: Date
  gameDuration: number
  disabled: boolean
  activeGame: {
    gameId: string
  }
}

export interface SlotPotatoActiveQueryData {
  slotPotatoActive: SlotPotato
}
