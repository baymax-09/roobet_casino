import React from 'react'

import { useTranslate } from 'app/hooks'

import { HistoryDetailsLine } from './HistoryDetailsLine'
import { cashPluginMap } from '../lib/maps'

export interface WithdrawRow {
  _id: string
  amount: number
  createdAt: Date
  status: string
  request?: {
    fields: {
      address: string
    }
  }
  meta?: {
    hash?: string
    status?: string
  }
  sent?: boolean
  transactionId?: string
  externalId?: string
  plugin?: string
  provider?: string
}

function determineWithdrawInfo(row) {
  const isLegacyCashWithdraw = !!cashPluginMap[row.plugin]
  const isCashWithdraw = !!row?.provider
  const defaultResponse = {
    isLegacyCashWithdraw,
    isCashWithdraw,
  }

  if (isLegacyCashWithdraw) {
    return {
      ...defaultResponse,
      status: row.status,
      transactionId: row.transactionId || '',
    }
  } else if (isCashWithdraw) {
    return {
      ...defaultResponse,
      transactionId: row.externalId || '',
      status: row.status,
    }
  } else {
    const transactionId = row?.meta?.hash
      ? row.meta.hash
      : row?.transactionId
        ? row.transactionId
        : 'N/A'
    const legacyStatus =
      row?.meta?.status || row?.sent ? 'completed' : 'pending'
    const status = row?.status ? row.status : legacyStatus
    const displayStatus = status === 'flagged' ? 'processing' : status

    return {
      ...defaultResponse,
      status: displayStatus,
      transactionId,
    }
  }
}

export const HistoryDetailsWithdraw: React.FC<{ row: WithdrawRow }> = ({
  row,
}) => {
  const translate = useTranslate()

  const { status, transactionId, isCashWithdraw, isLegacyCashWithdraw } =
    determineWithdrawInfo(row)

  return (
    <>
      <HistoryDetailsLine
        lineKey={
          isCashWithdraw || isLegacyCashWithdraw
            ? `${translate('historyDialog.id')}`
            : `${translate('historyDialog.hash')}`
        }
        value={transactionId}
      />
      {!isCashWithdraw &&
        !isLegacyCashWithdraw &&
        row.request &&
        row.request.fields && (
          <HistoryDetailsLine
            lineKey={translate('historyDialog.sentTo')}
            value={row.request.fields.address}
          />
        )}
      <HistoryDetailsLine
        lineKey={translate('historyDialog.status')}
        value={status.charAt(0).toUpperCase() + status.slice(1)}
      />
    </>
  )
}
