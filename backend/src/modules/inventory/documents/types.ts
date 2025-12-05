import { type Types } from 'mongoose'

import { type ThirdParty } from 'src/modules/bet/types'
import { type BalanceType } from 'src/modules/user/types'

export const itemRarityKeys = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const
export type ItemRarity = (typeof itemRarityKeys)[number]

/*
 * USAGE
 */

export interface ItemUsage {
  usageInterval?: ItemUsageInterval | null
  hasLimitedUses: boolean
  consumedOnDepletion: boolean
  usesLeft: number
  lastUsedDate: Date | null
}

export interface ItemUsageInterval {
  type?: ItemUsageIntervalType | null
  frequency: number
}

export const itemUsageIntervalKeys = [
  'HOURS',
  'DAYS',
  'WEEKS',
  'MONTHS',
] as const
export type ItemUsageIntervalType = (typeof itemUsageIntervalKeys)[number]

/*
 * BUFFS
 */

export const itemBuffTypeKeys = [
  'ROOWARDS',
  'FREE_BET',
  'EMOTE',
  'FREE_SPINS',
] as const
export type ItemBuffType = (typeof itemBuffTypeKeys)[number]

export type BuffSettings =
  | EmoteBuffSettings
  | FreeBetBuffSettings
  | RoowardsBuffSettings
  | FreeSpinsBuffSettings
  | null

export interface ItemBuff {
  type: ItemBuffType
  buffSettings?: BuffSettings
}

export interface EmoteBuffSettings {
  unlockedEmotes?: Array<string | null> | null
}

export interface FreeBetBuffSettings {
  games?: Array<string | null> | null
  freeBetAmount?: number | null
  freeBetType?: BalanceType | null
}

export interface RoowardsBuffSettings {
  roowardsModifier?: number | null
}

export interface FreeSpinGame {
  identifier: string
  pragmaticGameId?: string | null
}

export interface FreeSpin {
  tpGameAggregator: ThirdParty
  games: FreeSpinGame[]
  numberOfSpins: number
  spinAmount: number
}

export interface FreeSpinsBuffSettings {
  freeSpins?: FreeSpin[] | null
}

export interface InventoryItem {
  _id: Types.ObjectId
  name: string
  description: string
  imageUrl: string
  rarity: ItemRarity
  buff: ItemBuff
  usageSettings: ItemUsage
}

export interface ErrorFreeSpins {
  pragmaticBonusCodes: string[]
  softswissIssueIds: string[]
  hacksawExternalOfferIds: string[]
}
