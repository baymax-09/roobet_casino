import React from 'react'
import { useSelector } from 'react-redux'
import {
  Typography,
  InputField,
  Button,
  theme as uiTheme,
} from '@project-atl/ui'

import { useTranslate, useFeatureFlags, useDialogsOpener } from 'app/hooks'
import { api } from 'common/util'

import { EmailAddress, PhoneNumber } from './GeneralTabFields'
import { InfoBlock } from '../common'
import { LinkedAccounts } from './LinkedAccounts'
import { VisibilityButton } from '../VisibilityButton'

import { useGeneralTabStyles } from './GeneralTab.styles'

interface ReferredBy {
  referredBy: string
  canClaim: boolean
}

// const thirdPartyServices = [
//   {
//     id: 'google',
//     name: 'Google',
//     icon: 'google',
//     securityField: 'hasGoogle',
//     nameField: 'googleName',
//   },
// ]

export const GeneralTab: React.FC = React.memo(() => {
  const classes = useGeneralTabStyles()
  const translate = useTranslate()
  const openDialog = useDialogsOpener()

  const [oAuthWindow, setOAuthWindow] = React.useState<Window | null>(null)
  const [affiliateLoading, setAffiliateLoading] = React.useState(true)
  const [hasAffiliate, setHasAffiliate] = React.useState(false)
  const [affiliate, setAffiliate] = React.useState('')
  const [canClaimAffiliate, setCanClaimAffiliate] = React.useState(true)
  const [showSensitiveData, setShowSensitiveData] = React.useState(false)

  const oAuthInterval = React.useRef<ReturnType<typeof setInterval>>(null)

  const profileSettings = useSelector(
    ({ user }) => user?.systemSettings?.profile?.editable,
  )

  const accountClosure = useSelector(
    ({ user }) =>
      user?.hiddenTotalDeposited === 0 && user?.hiddenTotalWithdrawn === 0,
  )

  const { allowed: twilioEnabled } = useFeatureFlags(['twilioPhoneNumber'])
  const { allowed: isOAuthEnabled } = useFeatureFlags(['oauth'])

  const refreshAffiliate = React.useCallback(() => {
    const refresh = async () => {
      try {
        const { referredBy, canClaim } = await api.get<null, ReferredBy>(
          '/affiliate/referredBy',
        )

        if (referredBy) {
          setHasAffiliate(true)
          setAffiliate(referredBy)
        } else if (!canClaim || !referredBy) {
          setAffiliate('N/A')
        }

        setAffiliateLoading(false)
      } catch (err) {
        console.error('refreshAffiliate error', err)
      }
    }

    setAffiliate('')
    setAffiliateLoading(true)
    refresh()
  }, [])

  React.useEffect(() => {
    const onMessage = ({ data }) => {
      if (!!data && !data.event) {
        return
      }

      if (data.event === 'rbInit' && oAuthWindow) {
        oAuthWindow.close()
      }
    }

    window.addEventListener('message', onMessage)

    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [oAuthWindow])

  React.useEffect(() => {
    const openWindow = oAuthWindow
    if (!openWindow) {
      return
    }

    let oAuthInterval: ReturnType<typeof setInterval> | null = null

    oAuthInterval = setInterval(() => {
      if (openWindow.closed) {
        clearInterval(oAuthInterval!)
        setOAuthWindow(null)
      }
    }, 1000)

    return () => {
      if (!!openWindow && !openWindow.closed) {
        openWindow.close()
      }

      if (oAuthInterval !== null) {
        clearInterval(oAuthInterval)
      }
    }
  }, [oAuthWindow])

  React.useEffect(() => {
    refreshAffiliate()

    return () => {
      if (oAuthInterval.current) {
        clearInterval(oAuthInterval.current)
      }
    }
  }, [refreshAffiliate])

  // leaving these translations in the app incase we bring oauth back
  // translate('accountTab.alternateLoginMethods')
  // translate('accountTab.alternateLoginDesc')
  // translate('accountTab.link')
  // translate('accountTab.account')
  return (
    <>
      <InfoBlock title={translate('accountTab.accountRecovery')}>
        <div className={classes.GeneralTabInput}>
          <EmailAddress />
        </div>
        <div className={classes.GeneralTabInput}>
          {!!twilioEnabled && (
            <PhoneNumber
              maskSensitiveData={!!profileSettings?.maskSensitiveData}
            />
          )}
        </div>
      </InfoBlock>
      <InfoBlock title={translate('accountTab.referrer')}>
        <InputField
          color="secondary"
          disabled={true}
          value={affiliate}
          label={translate('accountTab.referredBy')}
          fullWidth
          size="medium"
          type={
            !showSensitiveData && profileSettings?.maskSensitiveData
              ? 'password'
              : 'text'
          }
          readOnly={hasAffiliate || !canClaimAffiliate}
          {...(profileSettings?.maskSensitiveData && {
            endAdornment: (
              <VisibilityButton
                showSlashIcon={showSensitiveData}
                onClick={() => setShowSensitiveData(!showSensitiveData)}
              />
            ),
          })}
        />
      </InfoBlock>
      {isOAuthEnabled && (
        <InfoBlock title={translate('accountTab.linkedAccounts')}>
          <LinkedAccounts />
        </InfoBlock>
      )}
      {accountClosure && (
        <InfoBlock title={translate('accountTab.accountClosure')} size="small">
          <Typography
            variant="body2"
            color={uiTheme.palette.neutral[400]}
            fontWeight={uiTheme.typography.fontWeightMedium}
            paddingBottom={uiTheme.spacing(0.5)}
          >
            {translate('accountTab.accountClosureDesc')}
          </Typography>
          <Button
            color="tertiary"
            variant="contained"
            onClick={() => openDialog('accountClose')}
            size="large"
            label={translate('accountTab.closeMyAccount')}
          />
        </InfoBlock>
      )}
    </>
  )
})
