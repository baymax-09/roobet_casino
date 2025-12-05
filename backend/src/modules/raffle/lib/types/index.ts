import { type AsyncOrSync } from 'ts-essentials'

import { type BetHistory } from 'src/modules/bet/types'

import { defaultRaffle } from './default'
import { adventRaffle } from './advent'
import { type Raffle } from '../../documents/raffle'

export type CoinSide = 'heads' | 'tails'

type ClaimRule =
  | {
      rakeback: true
      calcRakeback: (
        raffle: Raffle,
        userId: string,
        dryRun: boolean,
        coinSide?: CoinSide,
      ) => Promise<
        { success: true; amount: number } | { success: false; reason: string }
      >
      hasClaimedRakeback: (raffle: Raffle, userId: string) => Promise<boolean>
    }
  | {
      rakeback: false
    }

export type RaffleType = ClaimRule & {
  /**
   * If false, tickets will not be awarded for wagers. This is a hacky-ish
   * workaround for a specific advent raffle that only has rakeback.
   */
  awardTickets?: boolean

  /**
   * Optional modifier function that takes raw bet and returns
   * bet amount to be stored in tickets record. This should not
   * exist on the type if it is not being used. This value takes
   * precedent over the config-based modifier.
   */
  betModifier?: (raffle: Raffle, bet: BetHistory) => AsyncOrSync<number>
}

export type RaffleTypes = keyof typeof RAFFLE_TYPES
export type RaffleModifierType = (typeof RaffleModifierTypes)[number]

const raffleTypes = <T extends Record<string, RaffleType>>(types: T): T => types

const RAFFLE_TYPES = raffleTypes({
  default: defaultRaffle,
  advent: adventRaffle,
})

export const getRaffleSchema = (type: RaffleTypes): RaffleType =>
  RAFFLE_TYPES[type]

export const raffleTypesEnum = Object.keys(RAFFLE_TYPES)

export const RaffleModifierTypes = [
  'gameIdentifier',
  'gameProvider',
  'gameGroup',
] as const
export const isValidRaffleModifierType = (
  value: any,
): value is RaffleModifierType => RaffleModifierTypes.includes(value)
