import moment from 'moment'

import { type User } from 'src/modules/user/types'
import { getMultipleUsers } from 'src/modules/user'
import { addAffiliate } from 'src/modules/affiliate/lib'

import {
  getCRMByInfluencer,
  getCRMByUserId,
  updateCRMIfNotExist,
} from '../documents/crm'

export async function getAllInfluencers(limit = 25, page = 0) {
  const crmDocs = await getCRMByInfluencer(limit, page)
  const userIds =
    crmDocs?.data.length > 0 ? crmDocs.data.map(crmDoc => crmDoc.userId) : []
  const users = await getMultipleUsers(userIds)

  return {
    page,
    limit,
    count: crmDocs?.count || 0,
    data: users,
  }
}

export async function handleAffiliateUpdate(
  user: User,
  requestBody: { cxd: string; cxAffId: string; affiliateName: string },
) {
  const { cxd, cxAffId, affiliateName } = requestBody
  const isUserAccountNewlyCreated = !(
    moment().diff(user.createdAt, 'minutes') > 60
  )
  if (isUserAccountNewlyCreated) {
    const shouldUpdateCrmWithCellxpertData = cxd && cxAffId && !user.affiliateId

    if (shouldUpdateCrmWithCellxpertData) {
      await updateCRMIfNotExist(user.id, { cxd, cxAffId })
    } else if (affiliateName && !user.affiliateId) {
      const userCrmRecord = await getCRMByUserId(user.id)
      const userCrmRecordHasCellxpertData =
        userCrmRecord?.cxd && userCrmRecord?.cxAffId

      if (!userCrmRecordHasCellxpertData) {
        await addAffiliate(user.id, affiliateName)
      }
    }
  }
}

export * from './createUserConsent'
export * from './bonusCodes'
