import { type AsyncOrSync } from 'ts-essentials'

import { type Audit, insertAuditRecord } from '../documents/audit'

export const createAuditRecord = async <
  H extends (...args: any) => AsyncOrSync<any>,
>(
  auditData: Omit<Audit, 'success'>,
  asyncFunction: H,
) => {
  let success = true
  try {
    return await asyncFunction()
  } catch (err) {
    success = false
    throw err
  } finally {
    await insertAuditRecord({ ...auditData, success })
  }
}
