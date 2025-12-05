import { type FilterQuery, type ClientSession, Types } from 'mongoose'

import { withTransaction } from 'src/system'

import {
  RewardsAndQuestsLogbookModel,
  type RewardsAndQuestsLogbook,
} from './rewardsAndQuestsLogbook'
import { incrementItemRewardQuantity } from './itemRewards'
import { type InventoryItemReward } from './inventoryItemReward'

interface FilterLogbookQuery {
  userId?: string
}

interface UpdateLogbookRewardQuantity {
  rewardId: string
  questId?: string
  reward: InventoryItemReward
  logbook: RewardsAndQuestsLogbook
  session?: ClientSession
}

interface LogbookGetArgs {
  filter: FilterQuery<FilterLogbookQuery>
}
/*
 * CREATE
 */
export async function createRewardsAndQuestsLogbook({
  userId,
}: {
  userId: string
}): Promise<RewardsAndQuestsLogbook> {
  return await RewardsAndQuestsLogbookModel.create({
    userId,
    claimedRewardIds: [],
    claimedQuestIds: [],
  })
}

/*
 * READ
 */
export async function getOrCreateRewardsAndQuestsLogbook({
  userId,
}: {
  userId: string
}): Promise<RewardsAndQuestsLogbook> {
  const logbook = await getRewardsAndQuestsLogbook({ filter: { userId } })
  if (!logbook) {
    return await createRewardsAndQuestsLogbook({ userId })
  }
  return logbook
}

export async function getRewardsAndQuestsLogbook({
  filter: { userId },
}: LogbookGetArgs): Promise<RewardsAndQuestsLogbook | null> {
  return await RewardsAndQuestsLogbookModel.findOne({
    userId,
  }).lean<RewardsAndQuestsLogbook>()
}

/*
 * UPDATE
 */

export const updateLogbookRewardQuantity = async ({
  rewardId,
  reward,
  logbook,
}: UpdateLogbookRewardQuantity) => {
  // Check if the user has already claimed the reward
  const transactionResult = await withTransaction(async withSession => {
    if (
      reward.canBeClaimedOnlyOnce &&
      logbook.claimedRewardIds
        .map(rewardObjectId => rewardObjectId.toString())
        .includes(rewardId)
    ) {
      throw new Error('You may only claim this reward once.')
    }
    // Decrement the amount of rewards left
    if (!reward.hasInfiniteQuantity) {
      const updatedReward = await withSession(async session => {
        return await incrementItemRewardQuantity({
          filter: { rewardId, quantity: -1 },
          session,
        })
      })
      if (!updatedReward) {
        throw new Error('Could not decrement reward quantity.')
      }
    }

    const updatedLogbook = await withSession(async session => {
      return await RewardsAndQuestsLogbookModel.updateOne(
        { _id: logbook._id },
        { $push: { claimedRewardIds: new Types.ObjectId(rewardId) } },
        { session },
      )
    })
    if (updatedLogbook.modifiedCount !== 1) {
      throw new Error('Could not modify logbook.')
    }
    return updatedLogbook
  })
  if (!transactionResult) {
    throw new Error('Unable to claim reward.')
  }
}

export const updateLogbookRewardQuantityWithSession = async ({
  rewardId,
  questId,
  reward,
  logbook,
  session,
}: UpdateLogbookRewardQuantity) => {
  // Check if the user has already claimed the reward
  if (
    reward.canBeClaimedOnlyOnce &&
    logbook.claimedRewardIds
      .map(rewardObjectId => rewardObjectId.toString())
      .includes(rewardId)
  ) {
    throw new Error('You may only claim this reward once.')
  }
  // Decrement the amount of rewards left
  if (!reward.hasInfiniteQuantity) {
    await incrementItemRewardQuantity({
      filter: { rewardId, quantity: -1 },
      session,
    })
  }

  await RewardsAndQuestsLogbookModel.updateOne(
    { _id: logbook._id },
    {
      $push: {
        claimedRewardIds: new Types.ObjectId(rewardId),
        claimedQuestIds: new Types.ObjectId(questId),
      },
    },
    { session },
  )
}
