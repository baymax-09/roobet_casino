import { r } from 'src/system'
import { cleanupOldTableLeavingMinimumPerUser } from 'src/util/rethink'
import { type Types as UserTypes } from 'src/modules/user'
import { type DBCollectionSchema } from 'src/modules'

import { type Offer } from './gpt_history'
import { type PipelineAction } from '../lib/actions'
import { gptLogger } from '../lib/logger'

export interface PipelineFeedback {
  nextAction: PipelineAction
  reason?: string
}

export interface GPTPipelineEntry {
  id: string
  userId: string
  userName: string
  userJoined: Date
  offer: Offer
  pipelineFeedback: PipelineFeedback
  timestamp: Date
}

const tableName = 'gpt_pipeline'
const GptPipeline = r.table<GPTPipelineEntry>(tableName)

export async function getOfferById(offerId: string) {
  return await GptPipeline.get(offerId).run()
}

export async function deleteOfferById(offerId: string) {
  return await GptPipeline.get(offerId).delete().run()
}

export async function upsertOfferForUser(
  user: UserTypes.User,
  offer: Offer,
  pipelineFeedback: PipelineFeedback,
) {
  const logger = gptLogger('upsertOfferForUser', { userId: user.id })
  if (!offer || !user) {
    logger.error(`Warning: Cannot persist offer`, {
      user,
      offer,
    })
    return
  }

  const pipelineEntry: GPTPipelineEntry = {
    id: offer.id,
    userId: user.id,
    userName: user.name,
    userJoined: user.createdAt,
    offer,
    pipelineFeedback,
    timestamp: r.now(),
  }

  if (offer.id) {
    await GptPipeline.get(offer.id).replace(pipelineEntry).run()
  } else {
    logger.error(
      `warning: offer was inserted into pipeline for user with no id`,
      { offer, user },
    )
    const result = await GptPipeline.insert(pipelineEntry).run()
    offer.id = result.generated_keys[0]
  }
  return offer
}

export async function checkOfferAlreadyProcessed(offerId: string) {
  return (await GptPipeline.getAll(offerId).count().run()) > 0
}

export async function removeOfferFromPipeline(offerId: string) {
  return await GptPipeline.get(offerId).delete().run()
}

export const schema: DBCollectionSchema = {
  db: 'rethink',
  name: tableName,
  indices: [
    { name: 'timestamp' },
    { name: 'userId__timestamp', cols: p => [p('userId'), p('timestamp')] },
  ],
  cleanup: [
    async () => {
      await cleanupOldTableLeavingMinimumPerUser(
        tableName,
        r.now().sub(60 * 60 * 24 * 14),
        'timestamp',
        'userId',
        250,
      )
    },
  ],
}
