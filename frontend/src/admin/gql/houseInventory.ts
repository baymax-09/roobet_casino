import gql from 'graphql-tag'

const HouseInventoryItemFragment = gql`
  fragment HouseInventoryItem on HouseInventoryItem {
    id
    name
    isActive
    imageUrl
    description
    rarity
    buff {
      type
      buffSettings {
        ... on EmoteBuffSettings {
          unlockedEmotes
        }
        ... on FreeBetBuffSettings {
          games
          freeBetAmount
          freeBetType
        }
        ... on RoowardsBuffSettings {
          roowardsModifier
        }
      }
    }
    usageSettings {
      usageInterval {
        type
        frequency
      }
      hasLimitedUses
      consumedOnDepletion
      usesLeft
      lastUsedDate
    }
    quantity
    hasInfiniteQuantity
  }
`

export const HouseInventoryItemQuery = gql`
  ${HouseInventoryItemFragment}
  query HouseInventoryItem2($buffTypes: [String!]) {
    houseInventory(buffTypes: $buffTypes) {
      ...HouseInventoryItem
    }
  }
`

export const InventoryCreateItemMutation = gql`
  ${HouseInventoryItemFragment}
  mutation InventoryCreateItem1($data: InventoryItemCreateInput!) {
    inventoryItemCreateMutation(data: $data) {
      ...HouseInventoryItem
    }
  }
`

export const InventoryItemsAddToUser = gql`
  ${HouseInventoryItemFragment}
  mutation InventoryItemsAddToUser1($data: InventoryItemsAddToUserInput!) {
    inventoryItemsAddToUser(data: $data) {
      ...HouseInventoryItem
    }
  }
`
