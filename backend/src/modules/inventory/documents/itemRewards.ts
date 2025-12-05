import {
  type ClientSession,
  type FilterQuery,
  type UpdatePayload,
} from 'mongoose'

import { withTransaction } from 'src/system'
import { createNotification } from 'src/modules/messaging'
import { tuid } from 'src/util/i18n'
import { type Notification } from 'src/modules/messaging'

import * as InventoryItemDAO from './items'
import {
  type InventoryItemReward,
  InventoryItemRewardModel,
} from './inventoryItemReward'
import {
  getOrCreateRewardsAndQuestsLogbook,
  updateLogbookRewardQuantity,
  updateLogbookRewardQuantityWithSession,
} from './rewardsAndQuestsLogbooks'
import { type HouseInventoryItem } from './houseInventory'
import { WAGERED_THRESHOLD } from './consts'
import { type Quest } from './quest'
import { validateUserCompletedQuestCriteria, updateQuest } from './quests'
import { type ErrorFreeSpins } from './types'
import { inventoryLogger } from '../lib/logger'

interface FilterItemRewardsQuery {
  rewardIds?: string[]
  rewardId?: string
  userId?: string
  quest?: Quest
}

interface FilterItemFreeSpinRewards {
  activeQuests: Array<Omit<Quest, 'type'> & { type: 'NEW_PLAYER_INCENTIVE' }>
  userId: string
  betAmount: number
  errorsFreeSpins: ErrorFreeSpins
}

interface ProcessQuestArgs {
  quest: Omit<Quest, 'type'> & { type: 'NEW_PLAYER_INCENTIVE' }
  userId: string
  betAmount: number
  errorsFreeSpins: ErrorFreeSpins
}

interface FreeSpinRewardsTransactionArgs {
  quest: Omit<Quest, 'type'> & { type: 'NEW_PLAYER_INCENTIVE' }
  userId: string
  currentUserWageredAmount: number
  betAmount: number
  reward: InventoryItemReward
  errorsFreeSpins: ErrorFreeSpins
}

interface ItemRewardsGetArgs {
  filter: FilterQuery<FilterItemRewardsQuery>
}

interface InventoryItemRewardCreateArgs {
  itemReward: Omit<InventoryItemReward, '_id'>
}

interface FilterUpdateItemRewardQuery {
  rewardId?: string
  quantity?: number
}

interface InventoryItemRewardUpdateArgs {
  filter: FilterQuery<FilterUpdateItemRewardQuery>
  payload?: UpdatePayload<InventoryItemReward>
  session?: ClientSession
}
/*
 * CREATE
 */
export async function createItemReward({
  itemReward,
}: InventoryItemRewardCreateArgs): Promise<InventoryItemReward> {
  // Validate the existence of the house items passed in
  await Promise.all(
    itemReward.itemIds.map(async itemId => {
      // Check for the existence of the house item
      const houseItem: HouseInventoryItem | null =
        await InventoryItemDAO.getHouseItem({ filter: { itemId } })
      if (!houseItem) {
        throw new Error(`House item of id ${itemId} does not exist.`)
      }
      // Validate the quantity being withdrawn
      if (!itemReward.hasInfiniteQuantity && itemReward.quantity > 0) {
        // If all validation passes, remove the quantity from the house inventory
        if (!houseItem.hasInfiniteQuantity) {
          if (houseItem.quantity > 0) {
            await InventoryItemDAO.incrementHouseItemQuantity({
              filter: {
                itemId,
                quantity: -itemReward.quantity,
              },
            })
          } else {
            throw new Error('House item quantity cannot be less than 0.')
          }
        }
      }
    }),
  )
  return await InventoryItemRewardModel.create(itemReward)
}

export async function claimReward({
  rewardId,
  userId,
}: FilterItemRewardsQuery): Promise<boolean> {
  if (!userId || !rewardId) {
    throw new Error('userId and rewardId must be defined to claim a reward.')
  }
  const reward = await getInventoryItemReward({ filter: { rewardId } })
  if (!reward) {
    // Throw if the reward does not exist
    throw new Error(
      `Reward with id ${rewardId} does not exist, and cannot be claimed.`,
    )
  } else if (!reward.hasInfiniteQuantity && reward.quantity <= 0) {
    // Throw if the reward has a limited quantity and none are remaining
    throw new Error('There are no many rewards remaining to claim.')
  }

  // Generate a random float between 0 and 99.99...
  const dropRoll = Math.random() * 100
  // At a drop rate of 100, this always evaluates to false, and at a drop rate of 0 this is always true
  if (reward.dropRate <= dropRoll) {
    return false
  }

  const logbook = await getOrCreateRewardsAndQuestsLogbook({ userId })

  // Update logbook and reward quantity
  await updateLogbookRewardQuantity({ rewardId, reward, logbook })

  return true
}

export async function claimFreeSpinsFirstDepositPromo({
  activeQuests,
  userId,
  betAmount,
  errorsFreeSpins,
}: FilterItemFreeSpinRewards) {
  for (const quest of activeQuests) {
    await processQuest({ quest, userId, betAmount, errorsFreeSpins })
  }
}

export async function processQuest({
  quest,
  userId,
  betAmount,
  errorsFreeSpins,
}: ProcessQuestArgs) {
  const logger = inventoryLogger('processQuest', { userId })
  // Grab the reward from the quest
  if (!quest.rewardId) {
    throw new Error('No reward attached with quest.')
  }
  const filter = { rewardId: quest.rewardId.toString() }
  const reward = await getInventoryItemReward({ filter })
  if (!reward) {
    throw new Error('Invalid reward attached with quest.')
  }
  if (quest.userWageredAmountUSD === undefined) {
    throw new Error('userWageredAmountUSD not specified in quest.')
  }
  // Get the total amount the user has wagered after they have bet
  const currentUserWageredAmount = quest.userWageredAmountUSD
  // Throw if the reward has a limited quantity and none are remaining
  if (!reward.hasInfiniteQuantity && reward.quantity <= 0) {
    throw new Error('There are no rewards remaining to claim.')
  }
  // Begin quest progression/completion logic
  const result = await startQuestWithTransaction({
    quest,
    userId,
    currentUserWageredAmount,
    betAmount,
    reward,
    errorsFreeSpins,
  })
  // If result is null, but no error was thrown, then quest progress has been made, but yet to be completed.
  if (result !== 'completed') {
    return
  }
  // Send an on-site notification, if they completed the quest, to the user that they have received free spins
  // Note: this case should always be true, but it makes typescript happy
  try {
    let notificationMessage = `Congratulations! You have compeleted the quest ${quest.name}`
    const meta: Notification['meta'] = {}

    if (
      'wageredAmountUSD' in quest.criteriaSettings &&
      quest.criteriaType === 'NEW_PLAYER_INCENTIVE'
    ) {
      if (quest.criteriaSettings.wageredAmountUSD === 400) {
        meta.linkURL = '/game/pragmatic:vs20roohouse'
        notificationMessage = await tuid(
          userId,
          'new_player_incentive_tier_one',
        )
        logger.info(`${userId} completed NEW_PLAYER_INCENTIVE 400`)
      } else if (quest.criteriaSettings.wageredAmountUSD === 1000) {
        meta.linkURL = '/game/hacksaw:1233'
        notificationMessage = await tuid(
          userId,
          'new_player_incentive_tier_two',
        )
        logger.info(`${userId} completed NEW_PLAYER_INCENTIVE 1000`)
      } else if (quest.criteriaSettings.wageredAmountUSD === 2500) {
        meta.linkURL = '/game/pragmatic:vs20fruitswroo'
        notificationMessage = await tuid(
          userId,
          'new_player_incentive_tier_three',
        )
        logger.info(`${userId} completed NEW_PLAYER_INCENTIVE 2500`)
      } else {
        notificationMessage = `You have been awarded free spins for wagering over $${quest.criteriaSettings.wageredAmountUSD} on slot games!`
      }
    }
    await createNotification(userId, notificationMessage, 'wager', meta)
  } catch (error) {
    // If the notification fails, keep processing the other quests
    logger.error(
      `Failed to create notification`,
      { questId: quest._id.toString() },
      error,
    )
  }
}

export const startQuestWithTransaction = async ({
  quest,
  userId,
  currentUserWageredAmount,
  betAmount,
  reward,
  errorsFreeSpins,
}: FreeSpinRewardsTransactionArgs) => {
  // Check if the user has completed the quest criteria
  // Update the total wagered amount if not completed
  if (
    !(await validateUserCompletedQuestCriteria({
      quest,
      userId,
      currentUserWageredAmount,
    }))
  ) {
    if (
      'wageredAmountUSD' in quest.criteriaSettings &&
      quest.criteriaSettings.wageredAmountUSD
    ) {
      const filter = { _id: quest._id.toString() }
      const update = { $inc: { userWageredAmountUSD: betAmount } }

      // Check that if the user has completed the quest, and is within the threshold
      const questIncomplete =
        quest.criteriaSettings.wageredAmountUSD >=
        currentUserWageredAmount + betAmount + WAGERED_THRESHOLD
      if (questIncomplete) {
        await updateQuest({ filter, update })
        return 'incompleted'
      }
      const result = await withTransaction(async withSession => {
        // User has completed the quest
        await withSession(
          async session => {
            const completedUpdate = { ...update, completed: true }
            await updateQuest({ filter, update: completedUpdate, session })
          },
          {
            message: 'Unable to update quest in quest complete transaction',
            userId,
          },
        )
        // Update logbook with claimed reward, and completed quest
        await withSession(
          async session => {
            const rewardId = reward._id.toString()
            const questId = quest._id.toString()
            const logbook = await getOrCreateRewardsAndQuestsLogbook({ userId })
            await updateLogbookRewardQuantityWithSession({
              rewardId,
              questId,
              reward,
              logbook,
              session,
            })
          },
          {
            message: 'Unable to update logbook in quest complete transaction',
            userId,
          },
        )
        // Add items to user inventory (will be consumed immediately for FREE_SPINS)
        await withSession(
          async session => {
            const promises = []
            for (const houseItemId of reward.itemIds) {
              const data = {
                itemId: houseItemId,
                quantity: 1,
                userId,
                reason: `Quest - ${quest.name} - ${reward.name}`,
                issuerId: 'system',
              }
              promises.push(
                InventoryItemDAO.addItemsToUserInventoryForFreeSpins(
                  data,
                  errorsFreeSpins,
                  session,
                ),
              )
            }
            await Promise.all(promises)
          },
          {
            message:
              'Unable to add items to user inventory in quest complete transaction',
            userId,
          },
        )
        return 'completed'
      })
      if (!result) {
        throw new Error(
          'Unable to complete transaction in startQuestWithTransaction',
        )
      }
      return result
    }
  }
}

/*
 * READ
 */
export async function getInventoryItemRewards(): Promise<
  InventoryItemReward[]
> {
  return await InventoryItemRewardModel.find().lean<InventoryItemReward[]>()
}

export async function getInventoryItemReward({
  filter: { rewardId },
}: ItemRewardsGetArgs): Promise<InventoryItemReward | null> {
  return await InventoryItemRewardModel.findOne({
    _id: rewardId,
  }).lean<InventoryItemReward>()
}

/*
 * UPDATE
 */
export async function incrementItemRewardQuantity({
  filter: { rewardId, quantity = 1 },
  session,
}: InventoryItemRewardUpdateArgs) {
  return await InventoryItemRewardModel.findOneAndUpdate(
    { _id: rewardId },
    [
      {
        $set: {
          quantity: {
            $sum: [
              '$quantity',
              { $cond: [{ $ne: ['$hasInfiniteQuantity', true] }, quantity, 0] },
            ],
          },
        },
      },
    ],
    { new: true, ...(session && { session }) },
  ).lean<InventoryItemReward>()
}
