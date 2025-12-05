import { mongoose } from 'src/system'
import { type DBCollectionSchema } from 'src/modules'
import { type AssignableUserRoles } from 'src/modules/user/types'

export type DatabaseAction = 'edit' | 'delete' | 'create'

type AuditRecordRoles = Omit<AssignableUserRoles, ''> | 'Normal'

type Empty = Record<string, never>
interface AuditMeta {
  balanceChange: Empty
  kycApproval1: Empty
  kycApproval2: Empty
  kycApproval3: Empty
  kycApproval4: Empty
  kycDenial1: Empty
  kycDenial2: Empty
  kycDenial3: Empty
  kycDenial4: Empty
  kycDocDeletion: Empty
  kycDocApproval: Empty
  kycDocRejection: Empty
  kycDocDownload: Empty
  userLock: Empty
  userUnlock: Empty
  roleChange: {
    previousRole?: AuditRecordRoles
    roleUpdatedTo?: AuditRecordRoles
  }
  marketingChange: Empty
  sponsorChange: Empty
  influencerChange: Empty
  userSystemToggled: Empty
  cellxpertChange: Empty
  chatBadgeChange: Empty
  flaggedWithdrawalRejection: {
    withdrawalId: string
  }
  flaggedWithdrawalApproval: {
    withdrawalId: string
  }
  toggleGeoRestrict: Empty
}

export type ActionType =
  | 'balanceChange'
  | `kycApproval${'1' | '2' | '3' | '4'}`
  | `kycDenial${'1' | '2' | '3' | '4'}`
  | 'kycDocDeletion'
  | 'kycDocApproval'
  | 'kycDocRejection'
  | 'kycDocDownload'
  | 'userLock'
  | 'userUnlock'
  | 'roleChange'
  | 'marketingChange'
  | 'sponsorChange'
  | 'influencerChange'
  | 'userSystemToggled'
  | 'cellxpertChange'
  | 'chatBadgeChange'
  | 'flaggedWithdrawalRejection'
  | 'flaggedWithdrawalApproval'
  | 'toggleGeoRestrict'

export interface Audit {
  /** userIds */
  editorId: string
  subjectId: string
  notes: string
  databaseAction: DatabaseAction
  /** Represents keys changed in the database changed, example: audit.fields */
  actionType: ActionType
  success: boolean
  reason?: string
  meta?: AuditMeta[ActionType]
  updatedAt?: Date
  createdAt?: Date
}

const AuditSchema = new mongoose.Schema<Audit>(
  {
    editorId: { type: String, required: true },
    subjectId: { type: String, required: true },
    notes: { type: String, required: true },
    databaseAction: { type: String, required: true },
    success: { type: Boolean, required: true },
    actionType: { type: String, required: true },
    reason: { type: String },
    meta: {},
  },
  { timestamps: true },
)

export const AuditModel = mongoose.model<Audit>('audits', AuditSchema)

export const insertAuditRecord = async (doc: Omit<Audit, '_id'>) => {
  return await AuditModel.create(doc)
}

export const schema: DBCollectionSchema = {
  db: 'mongo',
  name: AuditModel.collection.name,
}
