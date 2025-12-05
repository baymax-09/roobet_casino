import { type BuffSettings, type FreeSpinTypeError } from './buffSettings'

export type FrequencyType = 'HOURS' | 'DAYS' | 'WEEKS' | 'MONTHS'

export type BuffType = 'FREE_BET' | 'ROOWARDS' | 'FREE_SPINS'

export type RarityType = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'

export interface TransferToUserType {
  transferUserId: string
  transferQuantity: number
}

export interface HouseInventoryItem {
  id: string
  name: string
  description: string
  imageUrl: string
  rarity: RarityType
  buff: {
    type: BuffType
    buffSettings: BuffSettings
  }
  usageSettings: {
    consumedOnDepletion: boolean
    usesLeft: number
    hasLimitedUses: boolean
    usageInterval: {
      frequency: number
      type: FrequencyType
    }
  }
  quantity: number
  hasInfiniteQuantity: boolean
}

export interface HouseInventoryResults {
  houseInventory: HouseInventoryItem[]
}

/*
 * ERROR TYPES
 */
export interface HouseInventoryItemError {
  name?: string
  imageUrl?: string
  description?: string
  games?: string
  freeBetAmount?: string
  roowardsModifier?: string
  freeSpins?: FreeSpinTypeError[]
}

export interface TransferToUserTypeError {
  transferUserId?: string
  transferQuantity?: string
}
