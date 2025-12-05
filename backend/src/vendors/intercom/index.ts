import fetch from 'node-fetch'

import { config } from 'src/system'
import { getUserById } from 'src/modules/user'
import { Mutex } from 'src/util/redisModels'
import { intercomLogger } from './lib/logger'

interface PostUserRequest {
  name: string
  email: string
  user_id: string
  created_at: Date
  custom_attributes: {
    'BTC Balance': string | number
    'ETH Balance': string | number
    'Referral Earnings': number
    'Total Deposited': number
    'Total Withdrawn': number
    'Total Bets': number
    'Total Bet': string | number
    'Total Deposits': number
    'Last Deposit': Date | undefined
    Role: string
    Manager: string
  }
}

const postUser = async (
  req: PostUserRequest,
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch('https://api.intercom.io/users', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.intercom.token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    })

    if (response.status === 200) {
      return { success: true }
    }
  } catch (error) {
    intercomLogger('postUser', { userId: req.user_id }).error(
      '[intercom] Failed to post user',
      { req },
      error,
    )
  }

  return { success: false }
}

export const updateIntercomContact = async (userId: string): Promise<void> => {
  const timeout = await Mutex.checkMutex('updateIntercomContact', userId)

  if (timeout) {
    return
  }

  const user = await getUserById(userId)

  if (!user) {
    return
  }

  if (!(user?.hiddenTotalDeposited > 0)) {
    return
  }

  if (!(user.hiddenTotalBet > 0)) {
    return
  }

  try {
    const post = await postUser({
      name: user.name,
      email: user.email,
      user_id: user.id,
      created_at: user.createdAt,
      custom_attributes: {
        'BTC Balance': user.balance ? user.balance.toFixed(4) : 0,
        'ETH Balance': user.ethBalance ? user.ethBalance.toFixed(4) : 0,
        'Referral Earnings': user.referralEarnings || 0,
        'Total Deposited': user.hiddenTotalDeposited || 0,
        'Total Withdrawn': user.hiddenTotalWithdrawn || 0,
        'Total Bets': user.hiddenTotalBets || 0,
        'Total Bet': user.hiddenTotalBet ? user.hiddenTotalBet.toFixed(2) : 0,
        'Total Deposits': user.hiddenTotalDeposits || 0,
        'Last Deposit': user.lastDeposit,
        Role: !user.role ? 'N/A' : user.role,
        Manager: !user.manager ? 'N/A' : user.manager,
      },
    })

    if (post.success) {
      // Only update intercom user every 120s.
      await Mutex.setMutex('updateIntercomContact', user.id, 120)
    }
  } catch (error) {
    intercomLogger('updateIntercomContact', { userId }).error(
      'Error updating intercom user',
      {},
      error,
    )
  }
}
