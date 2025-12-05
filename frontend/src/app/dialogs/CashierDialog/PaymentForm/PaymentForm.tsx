import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Trans } from 'react-i18next'
import { Button } from '@mui/material'
import { useHistory } from 'react-router'

import { env } from 'common/constants'
import {
  CashierConfig,
  initPaymentCashier,
  destroyPaymentCashier,
} from 'app/util/paymentiq'
import { ACCOUNT_SETTINGS_VERIFICATION_LINK } from 'app/routes/AccountSettingsRoute/constants/accountSettingsLinks'

import { usePaymentFormStyles } from './PaymentForm.styles'

const merchantId = env.PAYMENTIQ_MERCHANT_ID
const environment = env.PAYMENTIQ_ENV

interface PaymentFormProps {
  sessionId: string
  /** @todo make this more specific */
  transactionType: string
  userId: string
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  sessionId,
  transactionType,
  userId,
}) => {
  const classes = usePaymentFormStyles()
  const history = useHistory()

  const kycLevel = useSelector(({ user }) => user?.kycLevel || 0)
  const {
    accountDelete,
    autoOpenFirstPaymentMethod,
    predefinedAmounts,
    showAmountLimits,
    allowMobilePopup,
    receiptBackBtn,
    newPaymentBtn,
    listType,
    showtermsAndConditionsTemplate,
    errorMsgTxRefId,
    showCustomAmountButton,
  } = CashierConfig
  const iframeUrl = `https://pay.paymentiq.io/cashier/master/?environment=${environment}&merchantId=${merchantId}&userId=${userId}&method=${transactionType}&sessionId=${sessionId}&accountDelete=${accountDelete}&autoOpenFirstPaymentMethod=${autoOpenFirstPaymentMethod}&predefinedAmounts=${predefinedAmounts}&showAmountLimits=${showAmountLimits}&allowMobilePopup=${allowMobilePopup}&receiptBackBtn=${receiptBackBtn}&newPaymentBtn=${newPaymentBtn}&listType=${listType}&showtermsAndConditionsTemplate=${showtermsAndConditionsTemplate}&errorMsgTxRefId=${errorMsgTxRefId}&showCustomAmountButton=${showCustomAmountButton}`

  initPaymentCashier()

  if (window.CashierInstance) {
    // @ts-expect-error expand PIQ declaration
    window.CashierInstance.set({
      userId,
      sessionId,
      method: transactionType,
    })
  }

  useEffect(() => {
    return destroyPaymentCashier()
  }, [])

  const openKycDialog = React.useCallback(() => {
    history.push(ACCOUNT_SETTINGS_VERIFICATION_LINK)
  }, [])

  return (
    <>
      {kycLevel > 0 && (
        <iframe
          title="cash"
          src={iframeUrl}
          style={{ margin: 'auto', width: '100%', height: 270 }}
        />
      )}
      {kycLevel === 0 && (
        <div className={classes.kycRequired}>
          <Trans i18nKey="cashierDialog.kycRequired">
            <Button
              variant="contained"
              color="primary"
              onClick={openKycDialog}
            />
          </Trans>
        </div>
      )}
    </>
  )
}

export default React.memo(PaymentForm)
