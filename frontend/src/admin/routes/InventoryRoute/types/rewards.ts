import { type HouseInventoryItem } from './houseInventory'

export interface RewardInventory {
  id: string
  name: string
  dropRate: number
  canBeClaimedOnlyOnce: boolean
  quantity: number
  hasInfiniteQuantity: boolean
  items: Array<Pick<HouseInventoryItem, 'id' | 'name'>>
}

export interface RewardInventoryResults {
  inventoryItemRewards: RewardInventory[]
}
