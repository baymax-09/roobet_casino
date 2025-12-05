import React from 'react'
import { shallowEqual, useSelector } from 'react-redux'

import { RestrictedDepositTab } from './RestrictedDepositTab'
import { UnrestrictedDepositTab } from './UnrestrictedDepositTab'
import { DisabledDepositTab } from './DisabledDepositTab'
import { TabTemplate } from '../../templates'

const DepositTab: React.FC = () => {
  const userId = useSelector(({ user }) => user?.id || '')
  const userKYC = useSelector(
    ({ user }) => user?.kyc || { georestricted: false },
    shallowEqual,
  )
  const sessionId = useSelector(({ settings }) => settings?.sessionId || '')
  const regionRestricted = useSelector(
    ({ settings }) => settings?.restrictedRegion,
  )
  const depositDisabled = useSelector(
    ({ user }) => !user.systemSettings.deposit.enabled,
  )
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const getDepositTab = React.useCallback(() => {
    if (depositDisabled) {
      return <DisabledDepositTab />
    }
    if (regionRestricted || userKYC.georestricted) {
      return <RestrictedDepositTab />
    }
    return (
      <UnrestrictedDepositTab
        userId={userId}
        sessionId={sessionId}
        setErrorMessage={setErrorMessage}
      />
    )
  }, [
    depositDisabled,
    regionRestricted,
    userKYC.georestricted,
    sessionId,
    userId,
  ])

  return (
    <TabTemplate
      {...(errorMessage && {
        explainerProps: { message: errorMessage, error: true },
      })}
    >
      {getDepositTab()}
    </TabTemplate>
  )
}

export default React.memo(DepositTab)
