import { getActiveBetById, updateActiveBetForUser } from 'src/modules/bet'
import { getUserById } from 'src/modules/user'
import {
  deductFromBalance,
  getSelectedBalanceFromUser,
} from 'src/modules/user/balance'
import { r } from 'src/system'
import {
  BLACKJACK_GAME_NAME,
  BLACKJACK_INSURANCE_RATE,
  BlackjackActiveWagerUpdateError,
  BlackjackAlreadyInsuredWagerError,
  BlackjackError,
  BlackjackInsufficientFundsError,
  BlackjackInsureWagerError,
  BlackjackNoActiveWagerError,
  BlackjackPlayerNotFoundError,
  HandActionType,
  HandWagerType,
  WagerOutcomeType,
  isInsuranceWager,
  isPlayerSeatWithLiveHandWagers,
  type GameState,
  type PlayerHand,
  type PlayerSeatWithLiveWager,
} from '../../types'
import { isActiveBetWithWagers } from '../../types/bets'
import {
  getDealerHand,
  getPlayerByIdOrThrow,
  getPlayerHandByIndex,
  makeAction,
  validatePlayerHandAction,
} from '../../utils'
import { getHandStatus } from '../calculator'
import { withActiveGame } from '../game'

export async function insure(
  gameId: string,
  playerId: string,
  handIndex: number,
  accept: boolean,
): Promise<GameState> {
  return await withActiveGame(gameId, async (game: GameState) => {
    const player = validatePlayerHandAction(
      game,
      playerId,
      handIndex,
      HandActionType.Insurance,
    )
    const dealerHand = getDealerHand(game)
    const { realIndex } = getPlayerHandByIndex(game, playerId, handIndex)
    player.hands[realIndex] = await coreInsure(
      game,
      playerId,
      handIndex,
      accept,
    )
    player.hands[realIndex].status = getHandStatus(
      player.hands[realIndex],
      dealerHand,
    )
    return game
  })
}

/**
 * Performs the core `insure` logic.
 * @param game The {@link GameState} to use.
 * @param hand The {@link Hand} to update.
 * @returns The updated {@link Hand}.
 */
export async function coreInsure(
  game: GameState,
  playerId: string,
  handIndex: number,
  accept: boolean,
): Promise<PlayerHand> {
  const player = getPlayerByIdOrThrow(game, playerId)

  // If this is a `live` (i.e. NOT `demo`) bet then we need to update the bet.
  if (accept === true && isPlayerSeatWithLiveHandWagers(player)) {
    await mutateBetWithInsuranceWager(game, player, handIndex)
  }

  const { hand } = getPlayerHandByIndex(game, playerId, handIndex)
  hand.actions.push(makeAction(HandActionType.Insurance, { accept }))
  return hand
}

/**
 * Mutates the active bet to include the insurance wager.
 * @param game The {@link GameState} to use.
 * @param playerId The player ID.
 * @param handIndex The hand index.
 * @param betId The bet ID.
 */
async function mutateBetWithInsuranceWager(
  game: GameState,
  player: PlayerSeatWithLiveWager,
  handIndex: number,
) {
  const logScope = 'mutateBetWithInsuranceWager'
  const { playerId, betId } = player
  const { hand, realIndex } = getPlayerHandByIndex(game, playerId, handIndex)

  // Make sure we can ge the user
  const user = await getUserById(playerId)
  if (!user) {
    throw BlackjackError.logAndReturn(
      new BlackjackPlayerNotFoundError(game.id, logScope, playerId),
    )
  }

  // Make sure they have enough funds
  const insuranceAmount = hand.wager.amount * BLACKJACK_INSURANCE_RATE
  const { balance, balanceType } = await getSelectedBalanceFromUser({ user })
  if (balance < insuranceAmount) {
    throw BlackjackError.logAndReturn(
      new BlackjackInsufficientFundsError(
        game.id,
        playerId,
        handIndex,
        betId,
        logScope,
      ),
    )
  }

  // Make sure they have an active bet
  const activeBet = await getActiveBetById(betId)
  if (activeBet && isActiveBetWithWagers(activeBet)) {
    // Make sure there is not already an insurance wager
    const sides = activeBet.handWagers[realIndex].sides ?? []
    const insuranceWager = sides.find(isInsuranceWager)
    if (insuranceWager) {
      throw BlackjackError.logAndReturn(
        new BlackjackAlreadyInsuredWagerError(
          game.id,
          playerId,
          handIndex,
          betId,
          logScope,
        ),
      )
    }

    // Deduct the balance
    const deduction = await deductFromBalance({
      user,
      amount: insuranceAmount,
      transactionType: 'bet',
      balanceTypeOverride: balanceType,
      meta: {
        betId,
        provider: 'roobet',
        gameIdentifiers: { gameName: BLACKJACK_GAME_NAME },
      },
    })
    if (deduction.balance >= balance) {
      throw BlackjackError.logAndReturn(
        new BlackjackInsureWagerError(
          game.id,
          playerId,
          handIndex,
          betId,
          logScope,
        ),
      )
    }

    // Update the amount and note the insurance side wager
    const newSides = [
      ...(activeBet.handWagers[realIndex].sides ?? []),
      {
        amount: insuranceAmount,
        type: HandWagerType.Insurance,
        outcome: WagerOutcomeType.Unknown,
      },
    ]
    const activeChanges = {
      betAmount: r.row('betAmount').add(insuranceAmount),
      handWagers: r
        .row('handWagers')
        .merge({ [realIndex]: { sides: newSides } }),
    }

    // Save the updated bet
    const result = await updateActiveBetForUser(playerId, betId, activeChanges)
    if (result.errors > 0) {
      throw BlackjackError.logAndReturn(
        new BlackjackActiveWagerUpdateError(
          game.id,
          playerId,
          handIndex,
          betId,
          logScope,
        ),
      )
    }
  } else {
    throw BlackjackError.logAndReturn(
      new BlackjackNoActiveWagerError(
        game.id,
        playerId,
        handIndex,
        betId,
        logScope,
      ),
    )
  }
}
