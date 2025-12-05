import { Types } from 'mongoose'

import { getUserById } from 'src/modules/user'
import { getGame } from 'src/modules/tp-games/documents/games'
import { type TransactionMeta } from 'src/modules/user/documents/transaction'

import { updateFreespins, getFreespins } from '../../documents/freespins'
import { getUserBalance } from '../util'
import { creditBalance } from 'src/modules/user/balance'
import { getErrorStatusCode } from '../error'

interface FreespinsRequest {
  issue_id: string
  total_amount: number
  status: 'active' | 'expired' | 'played'
}

export async function freespins(request: FreespinsRequest) {
  const issueUpdate = await updateFreespins(
    { _id: new Types.ObjectId(request.issue_id) },
    { total_amount: request.total_amount, status: request.status },
  )

  if (request.total_amount > 0) {
    const user = await getUserById(issueUpdate.userId)

    if (!user) {
      return { ...getErrorStatusCode('unknown'), body: {} }
    }

    const amount = request.total_amount / 100

    const freespinsRecord = await getFreespins(request.issue_id)

    // We shouldn't ever have a freespin for a game we don't have.
    const tpGame = await getGame({ identifier: freespinsRecord?.games[0] })

    const transMeta: TransactionMeta['bonus'] = {
      provider: 'softswiss',
      gameIdentifiers: { identifier: tpGame?.identifier },
    }

    await creditBalance({
      user,
      amount,
      transactionType: 'bonus',
      meta: transMeta,
      balanceTypeOverride: null,
    })
  }

  const userBalance = await getUserBalance({ user_id: issueUpdate.userId })

  return {
    body: {
      balance: userBalance,
    },
    status: 200,
    code: 0,
  }
}
