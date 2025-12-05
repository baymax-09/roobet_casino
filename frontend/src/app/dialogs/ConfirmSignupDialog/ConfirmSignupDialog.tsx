import React from 'react'

import { useTranslate } from 'app/hooks'
import { env } from 'common/constants'

import { GenericAuthDialog } from '../GenericAuthDialog'

const cancelConfirm = () => {
  window.location.href = '/'
}

export const ConfirmSignupDialog = ({ params, DialogProps }) => {
  const { query } = params

  const translate = useTranslate()
  const [errorMessage, setErrorMessage] = React.useState('')

  const acceptConfirm = React.useCallback((query, translate) => {
    const searchParams = new URLSearchParams(query)
    if (!searchParams.has('provider')) {
      setErrorMessage(translate('authDialog.confirmSignupMissingProvider'))
    } else {
      const provider = searchParams.get('provider')
      if (provider === 'metamask') {
        // This flow does not work with Metamask due to the way we have to acquire nonces.
        // Better to just cancel at this point.
        setErrorMessage(translate('authDialog.confirmSignupMetamask'))
      } else {
        window.location.href = `${env.API_URL}/auth/oauth/${provider}?signup=true`
      }
    }
  }, [])

  const formSubmitHandler = event => {
    event.preventDefault()
    acceptConfirm(query, translate)
  }

  return (
    <GenericAuthDialog
      pageTitle={translate('authDialog.register')}
      header={translate('authDialog.promptConfirmSignup')}
      subHeader={translate('authDialog.placeBet')}
      buttonLabel={translate('authDialog.confirmSignupAccept')}
      DialogProps={DialogProps}
      formSubmitHandler={formSubmitHandler}
      errorMessage={errorMessage}
      backToLoginButton
      backToLoginButtonText={translate('authDialog.confirmSignupDeny')}
      backToLoginButtonOnClick={cancelConfirm}
    />
  )
}
