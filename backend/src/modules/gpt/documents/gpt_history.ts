import { r } from 'src/system'
import { cleanupOldTableLeavingMinimumPerUser } from 'src/util/rethink'
import { type Types as UserTypes } from 'src/modules/user'
import { type DBCollectionSchema } from 'src/modules'
import { type Currency } from 'src/modules/currency/types'

import { type PluginName } from '../lib/plugins'

export interface Offer {
  description: string
  id: string
  ip: string
  name: string
  network: PluginName
  offerId: string
  value: number
  currency: Currency
  secret?: string
  reason?: string
  rejected?: boolean
}

export interface GPTHistory {
  id: string
  offer: Offer
  timestamp: Date
  userId: string
  chargedBack?: boolean
}

const tableName = 'gpt_history'
const GptHistory = r.table<GPTHistory>(tableName)

export async function checkOfferAlreadyProcessedHistorically(
  offerId: string,
): Promise<boolean> {
  return (await GptHistory.getAll(offerId).count().run()) > 0
}

export async function checkOfferIsChargedBack(
  offerId: string,
): Promise<boolean> {
  return (
    (await GptHistory.getAll(offerId)
      .filter({ chargedBack: true })
      .count()
      .run()) > 0
  )
}

export async function chargeBackOffer(offerId: string) {
  return await GptHistory.getAll(offerId).update({ chargedBack: true }).run()
}

export async function addOfferToHistory(user: UserTypes.User, offer: Offer) {
  delete offer.secret
  await GptHistory.insert({
    id: offer.id,
    userId: user.id,
    offer,
    timestamp: r.now(),
  }).run()
}

export async function getGptHistoryForUser(userId: string) {
  return await GptHistory.between([userId, r.minval], [userId, r.maxval], {
    index: 'userId__timestamp',
  })
    .orderBy({ index: r.desc('userId__timestamp') })
    .limit(100)
    .run()
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
