import React from 'react'

import RegionRestrictedLogo from 'assets/icons/cashier/RegionRestricted.svg'
import { useTranslate } from 'app/hooks'

import { RestrictedTemplate } from '../../templates'

export const RestrictedDepositTab: React.FC = () => {
  const translate = useTranslate()

  return (
    <RestrictedTemplate
      icon={RegionRestrictedLogo}
      title={translate('regionRestricted.sorryNotAvailableText')}
      subtext={translate('regionRestricted.gamingLicenseText')}
    />
  )
}
