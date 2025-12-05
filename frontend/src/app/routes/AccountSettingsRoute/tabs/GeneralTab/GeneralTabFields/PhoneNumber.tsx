import React from 'react'
import { Button, InputField, theme as uiTheme } from '@project-atl/ui'
import { useMediaQuery } from '@mui/material'
import clsx from 'clsx'

import { useTranslate } from 'app/hooks'
import { useAxiosGet, useAxiosPost } from 'common/hooks'

import { useGeneralTabStyles } from '../GeneralTab.styles'
import { VisibilityButton } from '../../VisibilityButton'
import { SuccessMessage } from './SuccessMessage'

interface PhoneInfo {
  phone: string
  phoneVerified: boolean
  verifying: boolean
}

interface PhoneNumberProps {
  maskSensitiveData: boolean
}

export const PhoneNumber: React.FC<PhoneNumberProps> = ({
  maskSensitiveData,
}) => {
  const classes = useGeneralTabStyles()
  const translate = useTranslate()
  const isTabletOrDesktop = useMediaQuery(() => uiTheme.breakpoints.up('md'), {
    noSsr: true,
  })
  const [showSensitiveData, setShowSensitiveData] = React.useState(false)
  const [phone, setPhone] = React.useState('')
  const [code, setCode] = React.useState('')
  const [bottomMessage, setBottomMessage] = React.useState('')

  const updatePhoneNumberButtonRef = React.useRef<HTMLButtonElement>(null)

  const [{ data: phoneInfo, loading }, refetch] = useAxiosGet<PhoneInfo>(
    '/user/kyc/phone',
    {
      onCompleted: data => {
        if (data?.phone) {
          setPhone(data.phone)
        }
      },
    },
  )
  const [setPhoneNumber, { loading: setLoading, error: phoneNumberError }] =
    useAxiosPost('/user/kyc/setPhoneNumber', {
      onCompleted: () => {
        setBottomMessage(translate('accountTab.verificationCodeSent'))
        refetch()
      },
    })
  const [
    checkPhoneNumber,
    { loading: checkLoading, error: verificationError },
  ] = useAxiosPost('/user/kyc/checkPhoneNumber', {
    onCompleted: () => refetch(),
  })

  const phoneVerified = !!phoneInfo?.phoneVerified
  const verifyingPhoneNumber = !!phoneInfo?.verifying

  const updatePhoneNumber = React.useCallback(() => {
    setPhoneNumber({ variables: { phoneNumber: phone } })
  }, [setPhoneNumber, phone])

  const checkPhoneNumberVerification = React.useCallback(() => {
    checkPhoneNumber({ variables: { code } })
  }, [checkPhoneNumber, code])

  const busy = loading || setLoading || checkLoading
  const error = !!phoneNumberError || !!verificationError
  const verifying = verifyingPhoneNumber && !phoneVerified
  const label = verifying
    ? translate('accountTab.phoneNumberVerificationCode')
    : translate('accountTab.phoneNumber')

  const phoneNumberHelperText = phoneVerified ? (
    <SuccessMessage message={translate('accountTab.phoneHasBeenVerified')} />
  ) : undefined

  const phoneNumberErrorText = phoneNumberError
    ? translate('accountTab.invalidPhoneNumber')
    : undefined

  const verificationErrorText = verificationError
    ? translate('accountTab.incorrectPhoneNumberVerificationCode')
    : undefined

  const helperText =
    bottomMessage ||
    phoneNumberHelperText ||
    phoneNumberErrorText ||
    verificationErrorText

  return (
    <>
      <InputField
        color="secondary"
        type={!showSensitiveData && maskSensitiveData ? 'password' : 'tel'}
        disabled={busy || phoneVerified}
        value={verifying ? code : phone}
        onChange={event =>
          verifying ? setCode(event.target.value) : setPhone(event.target.value)
        }
        label={label}
        placeholder={verifying ? '123456' : '+49 (123) 456-7890'}
        error={error && !bottomMessage}
        fullWidth
        {...(helperText && {
          bottomMessage: helperText,
        })}
        bottomMessageProps={{
          className: clsx(classes.BottomMessage, {
            [classes.BottomMessage_error]: error,
          }),
        }}
        onKeyDown={event => {
          if (event.keyCode === 13) {
            event.preventDefault()
            if (verifying) {
              checkPhoneNumberVerification()
            } else {
              updatePhoneNumber()
            }
          }
        }}
        {...(maskSensitiveData && {
          endAdornment: (
            <VisibilityButton
              showSlashIcon={showSensitiveData}
              onClick={() => setShowSensitiveData(!showSensitiveData)}
            />
          ),
        })}
      />

      <div
        className={clsx(classes.GeneralTab__actions, {
          [classes.GeneralTab__actions_alignCenter]: helperText,
        })}
      >
        <Button
          className={classes.GeneralTab__button}
          borderOutline
          variant="contained"
          ref={updatePhoneNumberButtonRef}
          loading={setLoading || checkLoading}
          loadingProps={{ widthAndHeight: 30 }}
          disabled={busy || (!verifying && phone.length < 8) || phoneVerified}
          onClick={verifying ? checkPhoneNumberVerification : updatePhoneNumber}
          sx={{ height: '44px' }}
          color="primary"
          fullWidth={!isTabletOrDesktop}
          label={translate('accountTab.verify')}
        />
      </div>
    </>
  )
}
