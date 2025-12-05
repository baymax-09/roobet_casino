import React from 'react'
import { Box } from '@mui/material'
import { Button, Typography, theme as uiTheme } from '@project-atl/ui'

import { useFeatureFlags, useTranslate } from 'app/hooks'
import { MetamaskButton } from 'app/components'
import Google from 'assets/images/icons/Google.svg'
import Steam from 'assets/images/icons/Steam.svg'
import { env } from 'common/constants'

import { RegisterMode, type Mode } from './modes'
import { useSocialStyles } from './Socials.style'

interface SocialProps {
  mode: Mode
  busy: boolean
  recaptchaRef?: React.MutableRefObject<any>
  setOauthUri: React.Dispatch<React.SetStateAction<string | null>>
  onlyIcon?: boolean
}

export const Socials: React.FC<SocialProps> = ({
  mode,
  busy,
  recaptchaRef,
  setOauthUri,
  onlyIcon = false,
}) => {
  const classes = useSocialStyles()
  const translate = useTranslate()

  const { allowed: isOAuthEnabled } = useFeatureFlags(['oauth'])

  if (!isOAuthEnabled) {
    return null
  }

  const openAuthProvider = uri => {
    setOauthUri(uri)
  }

  const openOAuthProvider = (provider, signup) => {
    const recaptcha = recaptchaRef?.current.getValue() ?? ''
    const baseOauthUri = `${env.API_URL}/auth/oauth/${provider}`
    const authUriQuery: {
      signup?: string
      recaptcha?: string
      curriedRedirect?: string
    } = {}
    const { redirectURL } = JSON.parse(
      localStorage.getItem('redirectInfo') || '{}',
    )
    if (redirectURL) {
      authUriQuery.curriedRedirect = redirectURL
      localStorage.removeItem('redirectInfo')
    }
    if (signup) {
      authUriQuery.signup = 'true'
    }
    if (recaptcha && recaptcha.length) {
      authUriQuery.recaptcha = recaptcha
    }
    const authUri = `${baseOauthUri}?${new URLSearchParams(
      authUriQuery,
    ).toString()}`
    openAuthProvider(authUri)
  }

  const openMetamaskProvider = uri => {
    const recaptcha = recaptchaRef?.current.getValue() ?? ''
    openAuthProvider(
      recaptcha && recaptcha.length ? `${uri}&recaptcha=${recaptcha}` : uri,
    )
  }

  return (
    <Box
      width="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={1.5}
    >
      <div className={classes.divider}>
        <Typography
          variant="body4"
          fontWeight={uiTheme.typography.fontWeightBold}
        >
          {translate('authDialog.continueWith')}
        </Typography>
      </div>
      <div className={classes.Socials}>
        <Button
          className={classes.Socials__social}
          variant="contained"
          color="tertiary"
          size="medium"
          aria-label="Google Login"
          onClick={() => openOAuthProvider('google', mode === RegisterMode)}
          disabled={busy}
          {...(!onlyIcon && {
            startIcon: <img alt="Google" src={Google} />,
          })}
          label={onlyIcon ? <img alt="Google" src={Google} /> : 'Google'}
        />
        {/* TODO: Uncomment when Facebook reviews our app */}
        {/* <Button
          className={classes.Socials__social}
          variant="contained"
          color="tertiary"
          aria-label="Facebook Login"
          onClick={() => openOAuthProvider('facebook', mode === RegisterMode)}
          disabled={busy || resetPassword}
          startIcon={<FontAwesomeIcon icon={['fab', 'facebook']} />}
          label="Facebook"
        /> */}

        <Button
          className={classes.Socials__social}
          variant="contained"
          color="tertiary"
          size="medium"
          arial-label="Steam Login"
          onClick={() => openOAuthProvider('steam', mode === RegisterMode)}
          {...(!onlyIcon && {
            startIcon: <img alt="Steam" src={Steam} />,
          })}
          label={onlyIcon ? <img alt="Steam" src={Steam} /> : 'Steam'}
          disabled={busy}
        />
        <MetamaskButton
          className={classes.Socials__social}
          disabled={busy}
          signup={mode === RegisterMode}
          callback={openMetamaskProvider}
          onlyIcon={onlyIcon}
        />
      </div>
    </Box>
  )
}
