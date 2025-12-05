import React from 'react'
import { useSelector } from 'react-redux'
import { Alert } from '@mui/material'
import { Typography } from '@project-atl/ui'

import { KYCLevel1Form } from 'app/components'
import { useTranslate } from 'app/hooks'

import { PaymentForm } from '../../../PaymentForm'
import { useDepositTabStyles } from '../DepositTab.styles'

interface CashDepositOptionProps {
  sessionId: string
  userId: string
}

const CashDepositOptionView: React.FC<CashDepositOptionProps> = ({
  sessionId,
  userId,
}) => {
  const classes = useDepositTabStyles()
  const userHasKyc = useSelector(({ user }) => !!user?.kycLevel)
  const userKYC = useSelector(({ user }) => user?.kyc)
  const translate = useTranslate()

  return (
    <>
      {!userHasKyc && (
        <div>
          <Alert severity="info" className={classes.kycAlert}>
            <Typography variant="body2">
              {translate('depositTab.kycLevelOneVerification')}
            </Typography>
          </Alert>
          <KYCLevel1Form isPhoneRequired={!userKYC?.phone} kyc={userKYC} />
        </div>
      )}
      {userHasKyc && (
        <div style={{ display: 'flex' }}>
          <PaymentForm
            sessionId={sessionId}
            userId={userId}
            transactionType="deposit"
          />
        </div>
      )}
    </>
  )
}

export const CashDepositOption = React.memo(CashDepositOptionView)
