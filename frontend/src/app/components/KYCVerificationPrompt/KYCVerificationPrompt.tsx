import React from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import { useHistory } from 'react-router'

import { useDialogsOpener } from 'app/hooks'
import { type User } from 'common/types'
import { ACCOUNT_SETTINGS_VERIFICATION_LINK } from 'app/routes/AccountSettingsRoute/constants/accountSettingsLinks'

export const KYCVerificationPrompt: React.FC = () => {
  // Only allow this to happen once per mount.
  const [triggered, setTriggered] = React.useState(false)
  const history = useHistory()
  const user = useSelector(({ user }: { user?: User }) => user, shallowEqual)

  const openDialog = useDialogsOpener()

  React.useEffect(() => {
    if (!user?.kyc) {
      return
    }

    const overrideLevel = Number(user.userKYCOverrideLevel)

    const unverifiedLevels = (user.kyc.validationResults ?? []).filter(
      result => {
        return (
          result.level <= overrideLevel && !result.verified && !result.pending
        )
      },
    )

    if (unverifiedLevels.length === 0) {
      return
    }

    const firstUnverified = unverifiedLevels
      .map(({ level }) => level)
      .sort((a, b) => a - b)
      .shift()

    // Navigate user to verification account settings
    history.push(
      `${ACCOUNT_SETTINGS_VERIFICATION_LINK}&kycLevel=${firstUnverified}`,
    )

    setTriggered(true)
  }, [user, openDialog, triggered])

  // This component does not render anything.
  return null
}
