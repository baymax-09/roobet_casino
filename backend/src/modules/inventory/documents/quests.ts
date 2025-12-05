import {
  type ClientSession,
  type UpdateQuery,
  type FilterQuery,
} from 'mongoose'

import { getUserById } from 'src/modules/user'
import { type User } from 'src/modules/user/types'
import { createNotification } from 'src/modules/messaging'
import { tuid } from 'src/util/i18n'

import { QuestModel, type Quest } from './quest'
import { getQuestTemplates } from './questTemplates'
import { type QuestCriteriaType } from './questTemplate'
import { inventoryLogger } from '../lib/logger'

interface FilterQuestsQuery {
  completed: boolean
  type: string
  userId: string
}

interface FilterQuestUpdateArg {
  questId: string
}

interface UpdateQuestUpdateArg {
  wageredAmountUSD?: number
  completed?: boolean
}

interface ValidateUserMeetsCriteriaArgs {
  quest: Quest
  userId: string
  currentUserWageredAmount: number
}

interface QuestCreateArgs {
  payload: Omit<Quest, '_id' | 'progress'>
  session?: ClientSession
}

interface BulkWriteArgs {
  payload: any[]
}

interface GetQuestArgs {
  filter: FilterQuery<FilterQuestsQuery>
}

interface UpdateQuestArgs {
  filter: FilterQuery<FilterQuestUpdateArg>
  update: UpdateQuery<UpdateQuestUpdateArg>
  session?: ClientSession
}

/*
 * CREATE
 */
export async function createQuest({
  payload,
  session,
}: QuestCreateArgs): Promise<Quest> {
  return await (
    await new QuestModel(payload).save({ ...(session && { session }) })
  ).toObject()
}

export async function bulkWriteQuests({ payload }: BulkWriteArgs) {
  return await QuestModel.bulkWrite(payload)
}

export async function createQuestsFromType(
  criteriaType: QuestCriteriaType,
  userId: string,
) {
  // Get quest templates related to the quest type
  const newPlayerIncentiveQuestTemplates = await getQuestTemplates({
    criteriaType,
  })
  const quests = newPlayerIncentiveQuestTemplates.map(questTemplate => {
    const payload = {
      criteriaSettings: questTemplate.criteriaSettings,
      criteriaType: questTemplate.criteriaType,
      rewardId: questTemplate.rewardId,
      name: questTemplate.name,
      userId,
      completed: false,
      userWageredAmountUSD: 0,
    }
    return {
      insertOne: {
        document: payload,
      },
    }
  })
  const result = await bulkWriteQuests({ payload: quests })
  if (result.insertedCount !== newPlayerIncentiveQuestTemplates.length) {
    inventoryLogger('createQuestsFromType', { userId }).info(
      `Failed to create quests on bulkWrite`,
    )
    throw new Error(`Failed to create quests on bulkWrite for ${userId}`)
  }
  return result
}

export async function createQuestAfterDeposit(user: User) {
  // Create quests for the user to complete
  try {
    const questResults = await createQuestsFromType(
      'NEW_PLAYER_INCENTIVE',
      user.id,
    )
    const translatedMessage = await tuid(
      user.id,
      'first__deposit__notification',
    )
    await createNotification(user.id, translatedMessage, 'wager', {
      linkURL: 'tag/slots',
    })
    return questResults
  } catch (error) {
    inventoryLogger('createQuestAfterDeposit', { userId: user.id }).error(
      `Failed to create new player incentive quests for user`,
      {},
      error,
    )
  }
  return []
}
/*
 * READ
 */
export async function getQuests({ filter }: GetQuestArgs): Promise<Quest[]> {
  return await QuestModel.find(filter)
    .sort({ updatedAt: -1 })
    .lean<Quest[]>({ virtuals: true })
}

/*
 * UPDATE
 */
export async function updateQuest({
  filter,
  update,
  session,
}: UpdateQuestArgs): Promise<Quest | null> {
  return await QuestModel.findOneAndUpdate(filter, update, {
    new: true,
    ...(session && { session }),
  }).lean<Quest>()
}

export async function validateUserCompletedQuestCriteria({
  quest,
  userId,
  currentUserWageredAmount,
}: ValidateUserMeetsCriteriaArgs): Promise<boolean> {
  // User validation
  const user = await getUserById(userId)

  if (!user) {
    throw new Error(`User of id ${userId} does not exist`)
  }
  if (quest.criteriaType === 'PAGE_VIEW') {
    // Since we don't have any real criteria to evaluate (yet), we're just going to return true
    return true
  }
  if (quest.criteriaType === 'NEW_PLAYER_INCENTIVE') {
    const criteriaSettings = quest.criteriaSettings
    if (
      'wageredAmountUSD' in criteriaSettings &&
      criteriaSettings.wageredAmountUSD &&
      quest.completed
    ) {
      return true
    }
  }
  return false
}
