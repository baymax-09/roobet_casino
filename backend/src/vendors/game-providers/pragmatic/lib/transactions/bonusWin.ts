import { type Types as UserTypes } from 'src/modules/user'
import { getBalanceFromUserAndType } from 'src/modules/user/balance'

import { updateGameRound } from '../../documents/game-rounds'
import { makeSuccessResponse } from '../api'
import { type ProcessResult } from '../types'

/**
 * We add the balance during the previously called result.html calls.
 */

interface WinRoundRequest {
  userId: string
  amount: number
  bonusCode: string
  reference: string
  roundId: string
  providerId: string
  timestamp: Date
}

export interface BonusWinRespFields {
  currency: 'USD'
  cash: number
  bonus: number
}

type BonusWinResponse = ProcessResult<BonusWinRespFields>

export async function processBonusWin(
  user: UserTypes.User,
  request: WinRoundRequest,
): Promise<BonusWinResponse> {
  const { roundId } = request
  const gameSession = await updateGameRound(
    { gameSessionId: roundId },
    {
      finished: true,
    },
  )
  const balanceReturn = await getBalanceFromUserAndType({
    user,
    balanceType: gameSession.balanceType,
  })

  const response = makeSuccessResponse({
    currency: 'USD' as const,
    cash: balanceReturn.balance,
    bonus: 0,
  })
  return response
}
