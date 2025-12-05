import { type Types as UserTypes } from 'src/modules/user'
import { deductFromBalance } from 'src/modules/user/balance'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { checkCanPlaceBetOnGame } from 'src/modules/bet/lib/hooks'
import { getGame } from 'src/modules/tp-games/documents/games'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'

import { updateGame } from '../../documents/games'
import { type Action, type PlayRequest } from './play'
import { getDisplayCurrencyFromRequest } from '../currencies'
import { softswissLogger } from '../logger'

export async function processBetAction(
  request: PlayRequest,
  action: Action,
  user: UserTypes.User,
  betId: string,
): Promise<void> {
  const providerGame = await getGame({ identifier: request.game })
  const { canPlaceBet, reason } = await checkCanPlaceBetOnGame(
    user,
    request.game,
    providerGame,
  )
  if (!canPlaceBet) {
    if (['account__locked', 'action__disabled'].includes(reason)) {
      throw 'player disabled'
    }

    throw 'game disabled'
  }

  const betCurrency = getDisplayCurrencyFromRequest(request)

  if (!betCurrency) {
    throw 'invalid currency'
  }

  const { amount } = action

  // We increment betAmount below, after successfully deducting balance
  const game = await updateGame(
    { game_id: request.game_id },
    {
      game: request.game,
      userId: user.id,
    },
    { balanceType: user.selectedBalanceType, currency: betCurrency },
  )

  const meta: TransactionMeta['bet'] = {
    provider: 'softswiss',
    betId,
    gameSessionId: request.game_id,
    // This is full game identifier.
    gameIdentifiers: { identifier: game.game },
  }

  const betAmountUSD = await currencyExchange(amount, betCurrency)

  softswissLogger('processBetAction', { userId: user.id }).debug(
    'conversion info',
    { meta, amount, betCurrency, betAmountUSD },
  )

  await deductFromBalance({
    user,
    amount: betAmountUSD,
    transactionType: 'bet',
    meta,
    balanceTypeOverride: game.balanceType,
  })

  await updateGame(
    { game_id: request.game_id },
    {
      $inc: { betAmount: amount },
    },
  )
}
