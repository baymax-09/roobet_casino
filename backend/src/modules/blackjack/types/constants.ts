import { config } from 'src/system'

export const BLACKJACK_GAME_NAME = 'blackjack'
export const DECKS_PER_SHOE = 8
export const MAX_HAND_VALUE = 21
export const CARDS_PER_DECK = 52
export const MAX_SHOE_SIZE = CARDS_PER_DECK * DECKS_PER_SHOE
export const DEALER_ID = 'dealer'
export const DEALER_HOLE_INDEX = 1
/**
 * A=1 -> Z=26, "Blackjack" = 54 -> With Padding = 5400
 */
export const BLACKJACK_VERIFICATION_ERROR_CODE = 5400
export const BLACKJACK_INSURANCE_RATE = config.blackjack.insuranceRate
export const BLACKJACK_INSURANCE_PAYOUT = config.blackjack.insurancePayout
export const BLACKJACK_DEMO_BET = 0
export const BLACKJACK_MINI_BET = config.blackjack.minBet
export const BLACKJACK_MAXI_BET = config.blackjack.maxBet

export const BLACKJACK_PAYOUT_STANDARD_RATE = config.blackjack.payoutStandard
export const BLACKJACK_PAYOUT_BLACKJACK_RATE = config.blackjack.payoutBlackjack

export const BLACKJACK_MINI_BET_PERFECT_PAIR =
  config.blackjack.perfectPair.minBet
export const BLACKJACK_MAXI_BET_PERFECT_PAIR =
  config.blackjack.perfectPair.maxBet
export const BLACKJACK_PERFECT_PAIR_PAYOUT_TRUE =
  config.blackjack.perfectPair.payouts.true
export const BLACKJACK_PERFECT_PAIR_PAYOUT_COLORED =
  config.blackjack.perfectPair.payouts.colored
export const BLACKJACK_PERFECT_PAIR_PAYOUT_MIXED =
  config.blackjack.perfectPair.payouts.mixed

export const BLACKJACK_MINI_BET_21_PLUS_3 =
  config.blackjack.twentyOnePlusThree.minBet
export const BLACKJACK_MAXI_BET_21_PLUS_3 =
  config.blackjack.twentyOnePlusThree.maxBet
export const BLACKJACK_21_PLUS_3_PAYOUT_SUITED_TRIPLE =
  config.blackjack.twentyOnePlusThree.payouts.suitedTriple
export const BLACKJACK_21_PLUS_3_PAYOUT_STRAIGHT_FLUSH =
  config.blackjack.twentyOnePlusThree.payouts.straightFlush
export const BLACKJACK_21_PLUS_3_PAYOUT_THREE_OF_A_KIND =
  config.blackjack.twentyOnePlusThree.payouts.threeOfAKind
export const BLACKJACK_21_PLUS_3_PAYOUT_STRAIGHT =
  config.blackjack.twentyOnePlusThree.payouts.straight
export const BLACKJACK_21_PLUS_3_PAYOUT_FLUSH =
  config.blackjack.twentyOnePlusThree.payouts.flush
