import { fraudFeedback } from 'src/vendors/seon'
import { type Label } from 'src/vendors/seon/types'
import { type DepositStatus } from 'src/modules/deposit/types'
import { getSeonTransactionByInternalId } from 'src/vendors/seon/documents'
import { fraudLogger } from '../../lib/logger'

type LabelStatus = Exclude<DepositStatus, 'initiated' | 'pending'>

const LabelMap: Record<LabelStatus, Label> = {
  failed: 'Failed transaction',
  declined: 'Failed transaction',
  cancelled: 'Failed transaction',
  completed: 'Successful transaction',
}

function getFeedbackLabelForStatus(status: LabelStatus): Label {
  return LabelMap[status] || 'Failed transaction'
}

export async function feedbackForCashTransaction(
  transactionId: string,
  status: DepositStatus,
) {
  if (status === 'pending' || status === 'initiated') {
    return
  }
  const seonTransaction = await getSeonTransactionByInternalId(transactionId)

  if (!seonTransaction) {
    fraudLogger('feedbackForCashTransaction', { userId: null }).error(
      `Seon Transaction for ${transactionId} does not exist`,
      {
        transactionId,
        status,
      },
    )
    return
  }
  const label = getFeedbackLabelForStatus(status)
  await fraudFeedback(seonTransaction.internalId, label)
}
