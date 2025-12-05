import { type ActiveBet } from 'src/modules/bet/types'
import {
  type DealerSeatActive,
  type PlayerSeatWithLiveWager,
  type UserHandMainWager,
  type UserHandMainWagerRequest,
} from './player'

/**
 * An {@link ActiveBet} with an `extraBetParameters` object containing a `handWagers` object.
 */
export interface ActiveBetWithWagers extends ActiveBet {
  seatIndex: number
  playerCount: number
  handWagers: Record<string, UserHandMainWager>
}

/**
 * Determines if a bet is an {@link ActiveBetWithWagers}.
 * @param bet The {@link ActiveBet} to check.
 * @returns `true` if the bet is an {@link ActiveBetWithWagers}, `false` otherwise.
 */
export function isActiveBetWithWagers(
  bet: ActiveBet,
): bet is ActiveBetWithWagers {
  return (
    !!bet &&
    'seatIndex' in bet &&
    typeof bet.seatIndex === 'number' &&
    !isNaN(bet.seatIndex) &&
    'playerCount' in bet &&
    typeof bet.playerCount === 'number' &&
    !isNaN(bet.playerCount) &&
    'handWagers' in bet &&
    typeof bet.handWagers === 'object' &&
    !!bet.handWagers &&
    Object.entries(bet.handWagers).length > 0
  )
}

/**
 * The required data to close out a {@link PlayerSeat} with a {@link HandWithLiveWager}.
 */
export interface PlayerSeatCloseOut {
  gameId: string
  player: PlayerSeatWithLiveWager
  dealer: DealerSeatActive
}

/**
 * Builds the {@link ActiveBetWithWagers.handWagers handWagers} object from an array of {@link UserHandMainWager}s.
 * @param wagers The {@link UserHandMainWager}s to build the object from.
 * @returns The {@link ActiveBetWithWagers.handWagers handWagers} object.
 */
export function buildBetHandWagers<
  T extends UserHandMainWager | UserHandMainWagerRequest,
>(wagers: T[]): Record<string, T> {
  return wagers
    .map((wager, ndx) => ({ [ndx.toString()]: wager }))
    .reduce((a, b) => ({ ...a, ...b }), {})
}

/**
 * The additional bet parameters required provably fair on a {@link BlackjackGame}.
 */
export interface BlackjackExtraBetParams {
  clientSeed: string
  roundId: string
  roundHash: string
  nonce: number
}
