import { Types } from 'mongoose'
import { type DeepNullable, type DeepPartial } from 'ts-essentials'

import { config } from 'src/system'
import { tuid } from 'src/util/i18n'
import { createNotification } from 'src/modules/messaging'
import { getUserById } from 'src/modules/user'
import { BasicCache } from 'src/util/redisModels'
import { type FreespinIssuer } from 'src/modules/tp-games'

import {
  createBonus,
  deleteBonus,
  getBonusById,
  getBonuses,
  type SlotegratorBonus as SlotegratorBonusDocument,
  type SlotegratorBonusType,
} from '../documents/slotegratorBonuses'
import { makeSlotegratorRequest, createSportsbookSession } from './api'
import { slotegratorLogger } from '../../common/lib/logger'

// According to the docs, everything is optional, so making that so to be safe.

type DeepPartialNullable<T> = DeepPartial<DeepNullable<T>>

export type SlotegratorBonusTemplate = DeepPartialNullable<{
  id: number
  title: string
  active: boolean
  // 1 - Freebet; 2 - Comboboost
  bonus_type: 1 | 2
  active_from: number
  active_to: number
  custom_options: {
    restrictions: null
    freebet_data: {
      amount_list: Array<{
        amount: number
        max_cap: number
        currency: string
      }> | null
      type: 'bet_refund' | 'free_money' | 'snr'
      min_selection: number
      max_selection: number
      min_odd: number
      max_odd: number
    }
    comboboost_data: {
      min_odd: 0
      multipliers: string[]
      total_multiplier: number
      is_global: boolean
    }
  }
}>

export type SlotegratorBonus = DeepPartialNullable<{
  id: number
  ext_bonus_id: string
  bonus_template_id: number
  // 0 - new; 1 - active; 2 - activated; 3 - expired; 4 - revoked
  status: 0 | 1 | 2 | 3 | 4
  // 0 - freebet; 1 - comboboost
  type: 0 | 1
  // 0 - bet_refund; 1 - free_money; 2 - snr; 3 - comboboost
  sub_Type: 0 | 1 | 2 | 3
  active_from: number
  active_to: number
}>

interface SlotegratorBonusData {
  player_ids: string[]
  currency?: string
  amount?: number
  force_activate?: boolean
}

interface SlotegratorBonusIssueRequest {
  template_id: number
  bonuses_data: SlotegratorBonusData[]
}

type SlotegratorBonusIssueResponse = SlotegratorBonus[]

interface SlotegratorBonusRevokeRequest {
  bonuses_ids?: number[]
}

// Empty response.
type SlotegratorBonusRevokeResponse = Record<string, never>

const TEMPLATES_CACHE_KEY = 'slotegrator:templatesCache'

const getActiveBonusTemplatesFromServer = async (): Promise<
  | { success: false; forcedUpdate: false; error: any }
  | { success: true; forcedUpdate: true; templates: SlotegratorBonusTemplate[] }
> => {
  try {
    await makeSlotegratorRequest<SlotegratorBonusTemplate[]>({
      path: 'betting-bonus-templates/force-update',
    })

    const templates = await makeSlotegratorRequest<SlotegratorBonusTemplate[]>({
      path: 'betting-bonus-templates/list',
    })

    return {
      success: true,
      forcedUpdate: true,
      templates: templates.filter(({ active }) => active),
    }
  } catch (error) {
    return {
      error,
      forcedUpdate: false,
      success: false,
    }
  }
}

/**
 * Fetch the Slotegrator bonus templates from short term cache if it exists,
 * then attempted to fetch from the server. If the API call fails, we fall back
 * to the long term cache.
 */
export const getActiveBonusTemplates = async (): Promise<
  SlotegratorBonusTemplate[]
> => {
  const shortTermExp = 60 * 1 // 1 minute.
  const longTermExp = 60 * 60 * 24 // 24 hours.

  return await BasicCache.multilevelCache<SlotegratorBonusTemplate[]>(
    TEMPLATES_CACHE_KEY,
    shortTermExp,
    longTermExp,
    async () => {
      const serverResult = await getActiveBonusTemplatesFromServer()

      if (!serverResult.success) {
        slotegratorLogger('getActiveBonusTemplates', { userId: null }).error(
          'Failed to load betting bonus templates from Slotegrator.',
        )
        // Templates won't load but Slotegrator can't be trusted
        return []
      }

      return serverResult.templates
    },
  )
}

export const getActiveBonusesForUser = async (
  userId: string,
): Promise<
  Array<SlotegratorBonusDocument & { template?: SlotegratorBonusTemplate }>
> => {
  const templates = await getActiveBonusTemplates()

  // Get all active bonuses.
  const bonuses = await getBonuses({
    userId,
  })

  return bonuses.reduce<
    Array<SlotegratorBonusDocument & { template?: SlotegratorBonusTemplate }>
  >((items, doc) => {
    const template = templates.find(({ id }) => id === doc.templateId)

    // If the template is unavailable, do not return the bonus.
    if (!template) {
      return items
    }

    const item = {
      ...doc,
      template: templates.find(({ id }) => id === doc.templateId),
    }

    return [...items, item]
  }, [])
}

export const issueBonus = async ({
  userId,
  bonusTemplateId,
  amount,
  issuerId,
  reason,
}: {
  userId: string
  bonusTemplateId: number
  amount?: number
  issuerId: FreespinIssuer
  reason: string
}) => {
  const user = await getUserById(userId)

  if (!user) {
    throw new Error('User does not exist')
  }

  await createSportsbookSession(user)

  const amountFields =
    Number(amount) > 0
      ? {
          amount: Number(amount),
          currency: config.slotegrator.currency,
        }
      : {}

  const data = {
    template_id: bonusTemplateId,
    bonuses_data: [
      {
        player_ids: [userId],
        force_activate: true,
        ...amountFields,
      },
    ],
  }

  slotegratorLogger('issueBonus', { userId }).info(`Issuing bonus`, data)

  const bonuses = await makeSlotegratorRequest<
    SlotegratorBonusIssueResponse,
    SlotegratorBonusIssueRequest
  >({
    method: 'POST',
    path: 'betting-bonuses/issue',
    log: true,
    data,
  })

  // Create documents for each bonus issues.
  // In practice, this list will only be of size 1.
  for (const bonus of bonuses) {
    const { id, ext_bonus_id, active_from, active_to } = bonus

    if (id && ext_bonus_id && active_from && active_to) {
      const type: SlotegratorBonusType | undefined = (() => {
        if (bonus.type === 0) {
          return 'freebet'
        }

        if (bonus.type === 1) {
          return 'comboboost'
        }

        return undefined
      })()

      // Unsupported bonus type.
      if (!type) {
        continue
      }

      await createBonus({
        userId,
        amount,
        type,
        slotegratorId: id,
        externalId: ext_bonus_id,
        templateId: bonusTemplateId,
        activeFrom: new Date(active_from * 1000),
        activeTo: new Date(active_to * 1000),
        issuerId,
        reason,
      })

      await createNotification(
        userId,
        await tuid(userId, 'sportsbook_bonus'),
        'sportsbook',
        {
          linkURL: 'game/slotegrator:sportsbook-1',
        },
      )
    }
  }

  return bonuses
}

export const revokeBonus = async ({ bonusId }: { bonusId: string }) => {
  const bonusObjectId = new Types.ObjectId(bonusId)
  const bonus = await getBonusById(bonusObjectId)

  if (!bonus) {
    throw new Error('Failed to load specified bonus.')
  }

  const response = await makeSlotegratorRequest<
    SlotegratorBonusRevokeResponse,
    SlotegratorBonusRevokeRequest
  >({
    method: 'POST',
    path: 'betting-bonuses/revoke',
    data: {
      bonuses_ids: [bonus.slotegratorId],
    },
  })

  // Delete bonus record.
  await deleteBonus(bonusObjectId)

  return response
}
