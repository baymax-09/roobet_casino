import React from 'react'
import { Support } from '@project-atl/ui/assets'

import RestrictedDepositLogo from 'assets/icons/cashier/RestrictedDeposit.svg'
import { useTranslate } from 'app/hooks'

import { RestrictedTemplate } from '../../templates'

export const DisabledDepositTab: React.FC = () => {
  const translate = useTranslate()

  return (
    <RestrictedTemplate
      icon={RestrictedDepositLogo}
      title={translate('depositDisabled.title')}
      subtext={translate('depositDisabled.subtext')}
      buttonProps={{
        label: translate('depositDisabled.contactSupport'),
        startIcon: <Support width={16} height={16} />,
        onClick: () => window.Intercom('show'),
      }}
    />
  )
}
