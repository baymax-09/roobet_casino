import { type Types as UserTypes } from 'src/modules/user'
import { creditBalance } from 'src/modules/user/balance'
import { currencyExchange } from 'src/modules/currency/lib/currencyFormat'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'
import { preventOverMaxPayout } from 'src/modules/bet/util'

import { updateGame } from '../../documents/games'
import { type Action, type PlayRequest } from './play'
import { getDisplayCurrencyFromRequest } from '../currencies'
import { softswissLogger } from '../logger'

export async function processWinAction(
  request: PlayRequest,
  action: Action,
  user: UserTypes.User,
  betId: string,
): Promise<void> {
  const { amount } = action
  const winCurrency = getDisplayCurrencyFromRequest(request)
  if (!winCurrency) {
    throw 'invalid currency'
  }

  const game = await updateGame(
    {
      game_id: request.game_id,
    },
    {
      $inc: { payAmount: amount },
      userId: user.id,
    },
  )

  const transMeta: TransactionMeta['payout'] = {
    provider: 'softswiss',
    betId,
    gameSessionId: game.game_id,
    // This is the full game identifier.
    gameIdentifiers: { identifier: game.game },
  }

  const winAmountUSD = await currencyExchange(amount, winCurrency)
  softswissLogger('processWinAction', { userId: user.id }).info(
    'conversionInfo',
    { transMeta, amount, winCurrency, winAmountUSD },
  )

  const overMaxPayout = await preventOverMaxPayout(
    user.id,
    winAmountUSD,
    `${game.game}`,
  )
  if (!overMaxPayout) {
    await creditBalance({
      user,
      amount: winAmountUSD,
      transactionType: 'payout',
      meta: transMeta,
      balanceTypeOverride: game.balanceType,
    })
  }
}
