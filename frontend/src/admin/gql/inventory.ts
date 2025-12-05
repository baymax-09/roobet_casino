import gql from 'graphql-tag'

const HouseInventoryItemFragment = gql`
  fragment HouseInventoryItem2 on HouseInventoryItem {
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
        ... on FreeSpinsBuffSettings {
          freeSpins {
            tpGameAggregator
            numberOfSpins
            games {
              identifier
              pragmaticGameId
            }
            spinAmount
          }
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

const RewardInventoryItemFragment = gql`
  fragment RewardInventoryItem on InventoryItemReward {
    id
    items {
      id
      name
    }
    canBeClaimedOnlyOnce
    quantity
    dropRate
    name
    hasInfiniteQuantity
  }
`

export const HouseInventoryItemQuery = gql`
  ${HouseInventoryItemFragment}
  query HouseInventoryItem3($buffTypes: [String!]) {
    houseInventory(buffTypes: $buffTypes) {
      ...HouseInventoryItem
    }
  }
`

export const InventoryCreateItemMutation = gql`
  ${HouseInventoryItemFragment}
  mutation InventoryCreateItem($data: InventoryItemCreateInput!) {
    inventoryItemCreateMutation(data: $data) {
      ...HouseInventoryItem
    }
  }
`

export const InventoryUpdateItemMutation = gql`
  ${HouseInventoryItemFragment}
  mutation InventoryUpdateItem($data: InventoryItemUpdateInput!) {
    inventoryItemUpdateMutation(data: $data) {
      ...HouseInventoryItem
    }
  }
`

export const InventoryItemsAddToUser = gql`
  ${HouseInventoryItemFragment}
  mutation InventoryItemsAddToUser($data: InventoryItemsAddToUserInput!) {
    inventoryItemsAddToUser(data: $data) {
      ...HouseInventoryItem
    }
  }
`

export const RewardInventoryItemQuery = gql`
  ${RewardInventoryItemFragment}
  query GetInventoryItemRewards {
    inventoryItemRewards {
      ...RewardInventoryItem
    }
  }
`

export const InventoryItemRewardCreateMutation = gql`
  ${RewardInventoryItemFragment}
  mutation InventoryItemRewardCreateMutation(
    $data: InventoryItemRewardCreateInput!
  ) {
    inventoryItemRewardCreateMutation(data: $data) {
      ...RewardInventoryItem
    }
  }
`
