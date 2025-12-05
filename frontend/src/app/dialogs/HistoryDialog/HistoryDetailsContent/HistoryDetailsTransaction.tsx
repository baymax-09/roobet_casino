import React from 'react'

import { useTranslate } from 'app/hooks'

import { HistoryDetailsLine } from './HistoryDetailsLine'

export interface TransactionRow {
  _id: string
  type: string
  notes: string
  meta: {
    userName?: string
    toName?: string
    fromName?: string
  }
}

export const HistoryDetailsTransaction: React.FC<{ row: TransactionRow }> = ({
  row,
}) => {
  const translate = useTranslate()

  return (
    <>
      <HistoryDetailsLine
        lineKey={translate('historyDialog.transactionId')}
        value={row._id}
      />
      {row.type === 'tip' && (
        <HistoryDetailsLine
          lineKey={translate('historyDialog.sent')}
          value={row.meta.toName || row.meta.fromName}
        />
      )}
      {row.type === 'affiliate' && (
        <HistoryDetailsLine
          lineKey={translate('historyDialog.from')}
          value={row.meta.userName}
        />
      )}
    </>
  )
}
