import React from 'react'
import moment from 'moment'

import { useTranslate } from 'app/hooks'
import { Currency } from 'app/components/DisplayCurrency'

import { cashPluginMap } from '../lib/maps'
import { HistoryDetailsLine } from './HistoryDetailsLine'

export interface DepositRow {
  _id: string
  depositType?: string
  provider?: string
  paymentType?: string
  amount: number
  createdAt: Date
  externalId: string
  status: string
}

export const HistoryDetailsDeposit: React.FC<{ row: DepositRow }> = ({
  row,
}) => {
  const translate = useTranslate()

  const isLegacyCashDeposit =
    !!row.depositType && !!cashPluginMap[row.depositType]
  const isCashDeposit = !!row.provider || isLegacyCashDeposit

  return (
    <>
      {isCashDeposit && (
        <HistoryDetailsLine
          lineKey={translate('historyDialog.status')}
          value={row.status || 'N/A'}
        />
      )}
      <HistoryDetailsLine
        lineKey={
          isCashDeposit
            ? `${translate('historyDialog.id')}`
            : `${translate('historyDialog.hash')}`
        }
        value={row.externalId || 'None'}
      />
      <HistoryDetailsLine
        lineKey={translate('historyDialog.amount')}
        value={<Currency amount={row.amount} format="0,0.00" />}
      />
      <HistoryDetailsLine
        lineKey={translate('historyDialog.timestamp')}
        value={moment(row.createdAt).format()}
      />
    </>
  )
}
