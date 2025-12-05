import { claimFreeSpinsFirstDepositPromo } from '../documents/itemRewards'
import { getQuests } from '../documents/quests'
import { type ErrorFreeSpins } from '../documents/types'
import { cancelAllFreespins } from './cancelAllFreespins'
import { type Quest } from '../documents'
import { inventoryLogger } from '../lib/logger'

export const checkNewPlayerIncentiveEligibility = async (
  userId: string,
  betAmount: number,
) => {
  if (!userId) {
    throw new Error('user id must be defined.')
  }
  // Check if the user has any active quests for the free spins
  const filter = { completed: false, type: 'NEW_PLAYER_INCENTIVE', userId }
  const activeQuests = (await getQuests({ filter })) as Array<
    Omit<Quest.Quest, 'type'> & { type: 'NEW_PLAYER_INCENTIVE' }
  >
  if (!activeQuests.length) {
    return
  }
  // Keeps track of the freespins dispersed to the user in case of errors during the process.
  // If anything were to to wrong (e.g. database operation failed) after free spins were given out,
  // we need to cancel them.
  const errorsFreeSpins: ErrorFreeSpins = {
    pragmaticBonusCodes: [],
    softswissIssueIds: [],
    hacksawExternalOfferIds: [],
  }

  try {
    await claimFreeSpinsFirstDepositPromo({
      activeQuests,
      userId,
      betAmount,
      errorsFreeSpins,
    })
  } catch (error) {
    inventoryLogger('checkNewPlayerIncentiveEligibility', { userId }).error(
      `Failed to process new player incentives`,
      {
        activeQuests,
        betAmount,
        errorsFreeSpins,
      },
      error,
    )
    // Cancel the free spins if they were already given out to the user
    await cancelAllFreespins(errorsFreeSpins, userId)
  }
}
