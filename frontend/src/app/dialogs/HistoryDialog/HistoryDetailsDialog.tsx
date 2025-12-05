import React from 'react'
import { Helmet } from 'react-helmet'
import { Dialog } from '@project-atl/ui'

import { LoginOverlay } from 'mrooi'
import { useIsLoggedIn, useTranslate } from 'app/hooks'

import {
  HistoryDetailsBet,
  HistoryDetailsTransaction,
  HistoryDetailsDeposit,
  HistoryDetailsWithdraw,
} from './HistoryDetailsContent'

import { useHistoryDetailDialogStyles } from './HistoryDetailsDialog.styles'

const HistoryDetailsDialog = ({ DialogProps, ...props }) => {
  const { tabKey, row } = props.params

  const isLoggedIn = useIsLoggedIn()

  const translate = useTranslate()

  const classes = useHistoryDetailDialogStyles()
  const title = `${translate('navMenu.history')} - ${translate(
    'historyDialog.details',
  )}`

  return (
    <Dialog
      maxWidth="sm"
      title={title}
      showCloseInTitle={true}
      handleClose={DialogProps.onClose}
      closeOnBackdropClick={true}
      {...DialogProps}
    >
      <>
        <Helmet title={title} />
        {!isLoggedIn && (
          <LoginOverlay dialog="historyDetails" {...props.params.params} />
        )}
        <div className={classes.HistoryDetailDialog}>
          {tabKey === 'bets' && <HistoryDetailsBet row={row} />}
          {tabKey === 'all' && <HistoryDetailsTransaction row={row} />}
          {tabKey === 'deposits' && <HistoryDetailsDeposit row={row} />}
          {tabKey === 'withdrawals' && <HistoryDetailsWithdraw row={row} />}
        </div>
      </>
    </Dialog>
  )
}

export default React.memo(HistoryDetailsDialog)
