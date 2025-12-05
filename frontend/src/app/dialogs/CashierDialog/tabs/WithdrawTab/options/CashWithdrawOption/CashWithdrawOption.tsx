import React from 'react'
import { Tabs, Tab } from '@project-atl/ui'

import { type CashOption } from 'app/constants'
import { PaymentForm } from 'app/dialogs/CashierDialog/PaymentForm'
import { useTranslate } from 'app/hooks'
import { BlockTemplate } from 'app/dialogs/CashierDialog/templates'

import { type useCryptoWithdrawOption } from '../../hooks'
import { useDepositTabStyles } from '../../../DepositTab/DepositTab.styles'

interface CashWithdrawOptionProps {
  cashierOption: CashOption
  userId: string
  sessionId: string
  setShowWithdrawalButton: React.Dispatch<React.SetStateAction<boolean>>
  setWithdrawalEnabled: React.Dispatch<React.SetStateAction<boolean>>
  cashToCryptoOptions: ReturnType<typeof useCryptoWithdrawOption>
}

const PAYMENT_METHOD_SELECTION = [
  {
    id: 'paymentIq',
    // t('withdrawTab.cash')
    label: 'withdrawTab.cash',
  },
  {
    id: 'crypto',
    // t('withdrawTab.crypto')
    label: 'withdrawTab.crypto',
  },
] as const

export const CashWithdrawOption: React.FC<CashWithdrawOptionProps> = ({
  cashierOption,
  userId,
  sessionId,
  setShowWithdrawalButton,
  setWithdrawalEnabled,
  cashToCryptoOptions,
}) => {
  const classes = useDepositTabStyles()
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    React.useState<(typeof PAYMENT_METHOD_SELECTION)[number]['id']>('paymentIq')
  const translate = useTranslate()

  const { fields: cryptoFields, withdrawalEnabled } = cashToCryptoOptions

  React.useEffect(() => {
    if (selectedPaymentMethod === 'crypto') {
      return setShowWithdrawalButton(true)
    }
    return setShowWithdrawalButton(false)
  }, [selectedPaymentMethod, setShowWithdrawalButton])

  React.useEffect(() => {
    setWithdrawalEnabled(withdrawalEnabled)
  }, [withdrawalEnabled])
  return (
    <>
      <div>
        <Tabs
          // Allegedly this specific styling for our "Tabs" component will only be done once here
          sx={{
            '&.MuiTabs-root': {
              borderRadius: '1rem',
              '& > div ': {
                borderRadius: '0.75rem !important',
              },
            },
          }}
          variant="fullWidth"
          indicatorColor="default"
          value={selectedPaymentMethod}
          option={true}
          size="medium"
          color="default"
          onChange={(_, newTab) => setSelectedPaymentMethod(newTab)}
        >
          {PAYMENT_METHOD_SELECTION.map(tab => (
            <Tab key={tab.id} label={translate(tab.label)} value={tab.id} />
          ))}
        </Tabs>
      </div>
      <BlockTemplate
        {...(selectedPaymentMethod === 'paymentIq' && {
          contentContainerClassName: classes.ContentContainer_cashBackground,
        })}
      >
        {selectedPaymentMethod === 'paymentIq' ? (
          <div style={{ display: 'flex' }}>
            <PaymentForm
              sessionId={sessionId}
              userId={userId}
              transactionType="withdrawal"
            />
          </div>
        ) : (
          cryptoFields
        )}
      </BlockTemplate>
    </>
  )
}
