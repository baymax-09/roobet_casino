import { type ThirdParty } from 'src/modules/bet/types'

export const BonusCodeTypeValues = ['FREESPINS'] as const
export type BonusCodeType = (typeof BonusCodeTypeValues)[number]

interface FreeSpinsTypeSettings {
  amount?: number
  rounds?: number
  gameIdentifier?: string
  tpGameAggregator?: ThirdParty
}

export type BonusCodeTypeSettings = FreeSpinsTypeSettings
