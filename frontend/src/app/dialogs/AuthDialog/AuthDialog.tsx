import { useToggle } from 'react-use'
import { faEye, faEyeSlash } from '@fortawesome/pro-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Trans, useTranslation } from 'react-i18next'
import {
  IconButton,
  useMediaQuery,
  FormControlLabel,
  type Theme,
} from '@mui/material'
import React, { type MouseEventHandler } from 'react'
import ReCaptcha from 'react-google-recaptcha'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import {
  Checkbox,
  Typography,
  type ButtonProps,
  Link,
  theme as uiTheme,
} from '@project-atl/ui'

import {
  logEvent,
  api,
  postAuthRedirectQueryHandler,
  isApiError,
} from 'common/util'
import { useToasts } from 'common/hooks'
import { useDialogsLinkUpdate, useDialogsOpener, useTranslate } from 'app/hooks'
import { getAccount } from 'app/lib/user'
import { eraseCookie, store } from 'app/util'
import { setUser } from 'app/reducers/user'
import { MultiBoxInput } from 'app/components'

import { AuthDialogField } from './AuthDialogField'
import { getStorageItem } from '../../util'
import { GenericAuthDialog } from '../GenericAuthDialog'
import {
  LoginMode,
  RegisterMode,
  SetUsernameMode,
  ResetMode,
  TwoFactorRequiredMode,
  type Mode,
  TwoFactorEmailMode,
} from './modes'
import { Socials } from './Socials'
import { PostAuthItems } from './PostAuthItems'
import { type DialogKey } from '../util'

import { useAuthDialogStyles } from './AuthDialog.styles'

const NUM_BOXES = 6

interface LoginResponse {
  requiresPasswordReset?: boolean
  twofactorRequired?: boolean
  email?: string
  token?: string
}

const getMode = tab => {
  if (tab === SetUsernameMode) {
    return SetUsernameMode
  }
  if (tab === TwoFactorRequiredMode) {
    return TwoFactorRequiredMode
  }
  if (tab === TwoFactorEmailMode) {
    return TwoFactorEmailMode
  }
  if (tab !== LoginMode) {
    if (tab !== ResetMode) {
      return RegisterMode
    }
    return ResetMode
  }
  return LoginMode
}

const isDialogDismissible = (mode: string) => {
  return mode !== SetUsernameMode
}

interface AuthDialogProps {
  params: {
    tab: Mode
  }
  data: {
    continue: {
      dialog: DialogKey
      options: object
    }
  }
  DialogProps: { onClose: () => void }
}

const AuthDialogView: React.FC<AuthDialogProps> = ({
  DialogProps,
  params,
  data,
}) => {
  /**
   * @todo: Please refactor me. Selecting the entire user object will force a re-render.
   */
  const user = useSelector(({ user }) => user)
  const [isVerificationPrompt] = React.useState(!!user)

  postAuthRedirectQueryHandler(window.location)

  const {
    register,
    handleSubmit,
    clearErrors,
    setError,
    errors,
    getValues,
    setValue,
    watch,
    reset,
  } = useForm({
    shouldFocusError: true,
    shouldUnregister: false,
    defaultValues: {
      email: isVerificationPrompt ? user.email : '',
      password: '',
      username: '',
      recoveryCode: '',
    },
  })

  const [showPasswordText, togglePasswordVisibility] = useToggle(false)

  const classes = useAuthDialogStyles({ showPasswordText })
  const translate = useTranslate()
  const openDialog = useDialogsOpener()
  const { i18n } = useTranslation()

  const nextDialog = data.continue || null

  const recoveryCodeRef = React.useRef<HTMLInputElement | null>(null)
  const recaptchaRef = React.useRef<InstanceType<typeof ReCaptcha>>(null)
  const loginButtonRef = React.useRef<HTMLButtonElement>(null)
  const usernameRef = React.useRef<HTMLInputElement | null>(null)
  const passwordRef = React.useRef<HTMLInputElement | null>(null)
  const emailRef = React.useRef<HTMLInputElement | null>(null)
  const focusRef = React.useRef<number | null>(null)
  const ageRef = React.useRef()
  const tosRef = React.useRef()
  const { toast } = useToasts()

  const [createdAccount, setCreatedAccount] = React.useState(false)
  const [passwordRecovered, setPasswordRecovered] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [resetPassword, setResetPassword] = React.useState(false)
  const [recoverPassword, setRecoverPassword] = React.useState(false)
  const [requiresPasswordReset, setRequiresPasswordReset] =
    React.useState(false)
  const [oauthUri, setOauthUri] = React.useState<string | null>(null)
  const [passwordFocused, setPasswordFocused] = React.useState(false)
  const [usernameTaken, setUsernameTaken] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState('')
  const [mode, setModeView] = React.useState<Mode>(() => getMode(params?.tab))

  // 2FA
  const [boxValues, setBoxValues] = React.useState<Array<number | null>>(
    Array(NUM_BOXES).fill(null),
  )

  const defaultName = useSelector(({ user }) => {
    return mode === SetUsernameMode && !!user ? user.name : ''
  })

  const showEmail =
    [ResetMode, RegisterMode].includes(mode) &&
    !recoverPassword &&
    !passwordRecovered

  const showPassword =
    mode !== SetUsernameMode && (recoverPassword || mode !== ResetMode)

  const isTabletOrDesktop = useMediaQuery<Theme>(
    theme => uiTheme.breakpoints.up('md'),
    {
      noSsr: true,
    },
  )

  const regionRestricted = useSelector(
    ({ settings }) => settings?.restrictedRegion,
  )

  const setMode = React.useCallback((mode: Mode) => {
    clearErrors()
    togglePasswordVisibility(false)
    setErrorMessage('')

    if (mode !== LoginMode) {
      setCreatedAccount(false)
      setPasswordRecovered(false)
    }

    if (mode !== ResetMode) {
      setRecoverPassword(false)
      setResetPassword(false)
    }
    setBusy(false)
    reset()
    setModeView(state => mode)
  }, [])

  const setFormError = (name, message) => {
    setBusy(false)
    window.dataLayer.push({
      event: 'formError',
      name,
      message,
    })
    setError(name, {
      type: 'manual',
      message,
    })
  }

  const pageTitle = React.useMemo(() => {
    switch (mode) {
      case SetUsernameMode:
        return translate('authDialog.createYourAccount')
      case RegisterMode:
        return translate('authDialog.register')
      case ResetMode:
        return translate('authDialog.recoverAccount')
      default:
        return translate('authDialog.login')
    }
  }, [mode])

  const [header, subheader] = React.useMemo(() => {
    if (mode === TwoFactorEmailMode) {
      return [
        translate('twoFactorConfirm.emailVerification'),
        translate('twoFactorConfirm.emailedSixDigitCode'),
      ]
    }
    if (mode === TwoFactorRequiredMode) {
      return [
        translate('twoFactorConfirm.twoFactorAuthentication'),
        translate('twoFactorConfirm.enterSixDigitCode'),
      ]
    }
    if (requiresPasswordReset) {
      return [
        translate('lostPasswordConfirm.title'),
        translate('lostPasswordConfirm.message'),
      ]
    }
    if (recoverPassword) {
      return [
        translate('authDialog.recoverYourAccount'),
        translate('authDialog.emailedRecovery'),
      ]
    }
    if (passwordRecovered) {
      return [
        translate('authDialog.passwordReset'),
        translate('authDialog.passwordResetSuccess'),
      ]
    }
    if (mode === RegisterMode) {
      return [
        regionRestricted
          ? translate('authDialog.registerRestricted')
          : translate('authDialog.createYourAccount'),
        <div className={classes.Subheader}>
          <Typography className={classes.Subheader__title} variant="body2">
            {translate('authDialog.alreadyAccount')}
          </Typography>
          <Link
            className={classes.Subheader__link}
            onClick={() => setMode(LoginMode)}
            underline="hover"
            component="button"
            type="button"
            color={uiTheme.palette.primary[300]}
            variant="body2"
            fontWeight={uiTheme.typography.fontWeightBold}
            textAlign="start"
          >
            {translate('authDialog.login')}
          </Link>
        </div>,
      ]
    } else if (mode === ResetMode) {
      // This comment is required, do not remove (see i18next-parser)
      // translate('authDialog.cancelRecovery')
      return [
        translate('authDialog.recoverAccount'),
        translate('authDialog.enterYourEmail'),
      ]
    } else if (mode === SetUsernameMode) {
      return [translate('authDialog.createYourAccount'), null]
    }

    return [
      translate('authDialog.loginToYourAccount'),
      <div className={classes.Subheader}>
        <Typography className={classes.Subheader__title} variant="body2">
          {translate('authDialog.dontHaveAccount')}
        </Typography>
        <Link
          className={classes.Subheader__link}
          onClick={() => setMode(RegisterMode)}
          underline="hover"
          component="button"
          type="button"
          color={uiTheme.palette.primary[300]}
          variant="body2"
          fontWeight={uiTheme.typography.fontWeightBold}
          textAlign="start"
        >
          {translate('authDialog.register')}
        </Link>
        ,
      </div>,
    ]
  }, [
    mode,
    setMode,
    recoverPassword,
    createdAccount,
    user,
    requiresPasswordReset,
    passwordRecovered,
    regionRestricted,
  ])

  const primaryButtonName = React.useMemo(() => {
    if (mode === ResetMode) {
      if (recoverPassword) {
        return translate('authDialog.setPassword')
      }
      return translate('authDialog.sendRecovery')
    }

    return regionRestricted
      ? translate('authDialog.register')
      : translate('authDialog.playNow')
  }, [mode, recoverPassword])

  const closeDialogIfNoNext = success => {
    if (!!nextDialog && success) {
      openDialog(nextDialog.dialog, { ...nextDialog.options })
      return
    }
    DialogProps.onClose()
  }

  const updateLink = React.useCallback(
    link => {
      link.tab = mode
    },
    [mode],
  )

  useDialogsLinkUpdate(updateLink)

  React.useEffect(() => {
    eraseCookie('token')
    eraseCookie('twofactorRequired')
  }, [])

  // Callback of sorts when oauth uri is set for captcha
  React.useEffect(() => {
    if (oauthUri && oauthUri.length) {
      execute()
    }
  }, [oauthUri])

  React.useEffect(() => {
    const onMessage = async event => {
      const { data } = event

      if (!data?.event) {
        return
      }

      if (data.event === 'rbInit') {
        if (data.payload.twoFactorRequired) {
          setBusy(false)
          setMode(TwoFactorRequiredMode)
          return
        }

        const user = await getAccount()

        if (!user) {
          logEvent(
            'OAuth returned null user',
            {
              hadToken: !!data.payload.token,
              tokenLength: data.payload.token ? data.payload.token.length : 0,
            },
            'warn',
          )
        }

        window.dataLayer.push({
          event: 'oauth',
        })

        closeDialogIfNoNext(true)
      }
    }

    window.addEventListener('message', onMessage)

    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [])

  React.useLayoutEffect(() => {
    window.dataLayer.push({
      event: 'modalShown',
      modal: mode,
    })

    if (focusRef.current) {
      clearInterval(focusRef.current)
      focusRef.current = null
    }

    if (!isTabletOrDesktop || busy) {
      return
    }

    // @ts-expect-error TODO fix node types collision
    focusRef.current = setTimeout(() => {
      focusRef.current = null

      if (errors.username && usernameRef.current) {
        usernameRef.current.focus()
      } else if (errors.password && passwordRef.current) {
        passwordRef.current.focus()
      } else if (mode === ResetMode) {
        if (recoveryCodeRef.current) {
          recoveryCodeRef.current.focus()
        } else if (emailRef.current) {
          emailRef.current.focus()
        }
      } else {
        if (usernameRef.current) {
          usernameRef.current.focus()
        }
      }
    }, 500)

    return () => {
      // @ts-expect-error TODO fix node types collision
      clearTimeout(focusRef.current)
    }
  }, [isTabletOrDesktop, busy, mode, errors])

  const onRequiredPasswordResetContinue = () => {
    setRequiresPasswordReset(false)
    setMode(ResetMode)
    setRecoverPassword(true)
  }

  const onRecaptchaChange = async () => {
    if (!recaptchaRef.current) {
      setFormError('username', translate('authDialog.recaptchaError'))
      return
    }

    const { username, password, email } = getValues()
    const recaptcha = recaptchaRef.current.getValue()
    recaptchaRef.current.reset()

    if (oauthUri && oauthUri.length) {
      setBusy(false)
      setOauthUri(null)
      window.location.href = oauthUri
      return
    }

    if (mode === LoginMode) {
      try {
        const response = await api.post<any, LoginResponse>('/auth/login', {
          password,
          recaptcha,
          email: username,
        })

        if (response.requiresPasswordReset) {
          setRequiresPasswordReset(true)
          setBusy(false)
          return
        }

        if (response.twofactorRequired) {
          if (response.email) {
            setMode(TwoFactorEmailMode)
            return
          }
          setMode(TwoFactorRequiredMode)
          return
        }

        const user = await getAccount()

        /*
         * Update language in the browser if the user has a setting
         * and the language is different from the browser language
         */
        if (
          user &&
          user.locale &&
          user.locale !== getStorageItem('i8nextLang')
        ) {
          i18n.changeLanguage(user.locale)
        }

        closeDialogIfNoNext(true)
        window.dataLayer.push({
          event: 'login',
        })
      } catch (err) {
        const { errorMessage, errorCode } = (() => {
          if (isApiError(err)) {
            return { errorMessage: err.response.data, errorCode: err.code }
          }
          return {
            errorMessage: translate('authDialog.contactSupportError'),
            errorCode: null,
          }
        })()
        setValue('password', '')

        if (errorCode?.includes('username')) {
          setFormError('username', errorMessage)
        } else if (errorCode?.includes('password')) {
          setFormError('password', errorMessage)
        } else {
          toast.error(errorMessage)
        }
        setBusy(false)
      }
    } else if (mode === RegisterMode) {
      try {
        const signupRequest = {
          username,
          password,
          email,
          recaptcha,
        }
        const headers = {
          'X-Seon-Session-Payload': window.seonSessionPayload || '',
        }
        await api.post('/auth/signup', signupRequest, { headers })

        const user = await getAccount()

        if (user) {
          window.dataLayer.push({
            event: 'signup',
            user_id: user.id,
          })
        }
        setCreatedAccount(true)
        setBusy(false)
        closeDialogIfNoNext(true)
      } catch (err) {
        logEvent('Sign Up Error', { mode, err }, 'warn')
        const { errorMessage, errorCode } = (() => {
          if (isApiError(err)) {
            return { errorMessage: err.response.data, errorCode: err.code }
          }
          return {
            errorMessage: translate('authDialog.recaptchaError'),
            errorCode: null,
          }
        })()

        setBusy(false)

        if (errorCode?.includes('password')) {
          setFormError('password', errorMessage)
        } else if (errorCode?.includes('email')) {
          setFormError('email', errorMessage)
        } else if (errorCode?.includes('user')) {
          setFormError('username', errorMessage)
        } else {
          toast.error(errorMessage)
        }
      }
    } else if (mode === SetUsernameMode) {
      try {
        await api.post('account/setName', {
          name: username,
        })

        store.dispatch(setUser({ mustSetName: false, name: username }))
        DialogProps.onClose()

        setBusy(false)
        closeDialogIfNoNext(true)
      } catch (err) {
        logEvent('Change Username Error', { mode, err }, 'warn')

        const { errorMessage, errorCode } = (() => {
          if (isApiError(err)) {
            return { errorMessage: err.response.data, errorCode: err.code }
          }
          return {
            errorMessage: translate('authDialog.recaptchaError'),
            errorCode: null,
          }
        })()

        setBusy(false)

        if (errorCode?.includes('user')) {
          setFormError('username', errorMessage)
        } else {
          toast.error(errorMessage)
        }
      }
    }
  }

  const execute = () => {
    // Don't want to show recaptcha on 2FA
    if ([TwoFactorEmailMode, TwoFactorRequiredMode].includes(mode)) {
      return
    }

    setBusy(true)
    recaptchaRef.current?.execute()
  }

  const onResetPassword = async () => {
    const { email, password, recoveryCode } = getValues()

    if (recoverPassword) {
      setBusy(true)

      try {
        await api.post('/auth/recoverConfirm', {
          password,
          token: recoveryCode,
        })

        setBusy(false)
        setRecoverPassword(false)
        setResetPassword(false)
        setPasswordRecovered(true)
      } catch (err) {
        const errorMessage = (() => {
          if (isApiError(err)) {
            return err.response ? err.response.data : err.message
          }
          return translate('authDialog.contactSupportError')
        })()
        setFormError(
          errorMessage.includes('Password') ? 'password' : 'recoveryCode',
          errorMessage,
        )
        setBusy(false)
      }
      return
    }

    setBusy(true)

    try {
      await api.post('/auth/recover', {
        email,
      })

      setRecoverPassword(true)
    } catch (err) {
      const errorMessage = (() => {
        if (isApiError(err)) {
          return err.response ? err.response.data : err.message
        }
        return translate('authDialog.contactSupportError')
      })()
      setFormError('email', errorMessage)
    }

    setBusy(false)
  }

  const onSubmitPasswordRecovered: MouseEventHandler = event => {
    event.preventDefault()
    setPasswordRecovered(false)
    setMode(LoginMode)
  }

  const verify2FA = React.useCallback(
    async (twofactorCode: string) => {
      setBusy(true)
      try {
        await api.get('/auth/validate2faForToken', {
          params: {
            twofactorCode,
          },
        })

        await getAccount()
        setErrorMessage('')
        closeDialogIfNoNext(true)
      } catch (err) {
        setErrorMessage(translate('twoFactorConfirm.errorAuthenticateToken'))
      } finally {
        setBusy(false)
      }
    },
    [translate],
  )

  const onSubmit = React.useCallback(
    async ({ email }) => {
      if (requiresPasswordReset) {
        onRequiredPasswordResetContinue()
        return
      }
      clearErrors()
      setPasswordRecovered(false)
      if (mode === ResetMode) {
        await onResetPassword()
      } else if ([TwoFactorEmailMode, TwoFactorRequiredMode].includes(mode)) {
        if (boxValues.some(value => value === null)) {
          setErrorMessage(translate('securityTab.incorrectToken'))
          return
        }
        await verify2FA(boxValues.join(''))
      } else {
        execute()
      }
    },
    [getValues, mode, recoverPassword, requiresPasswordReset, boxValues],
  )

  const formSubmitHandler = handleSubmit(onSubmit)

  const submitWithKey = event => {
    if (
      event.keyCode === 13 ||
      event.code === 'Enter' ||
      event.keyCode === 9 ||
      event.code === 'Tab'
    ) {
      formSubmitHandler()
    }
  }
  const handleRegistrationStart = event => {
    const regIntentPresent = window.dataLayer.some(
      item => item.event === 'regIntent',
    )
    if (mode === RegisterMode && !regIntentPresent) {
      window.dataLayer.push({ event: 'regIntent' })
    }
  }

  const handleFocused = () => {
    if (mode === RegisterMode) {
      setPasswordFocused(true)
    }
  }
  const handleBlur = () => {
    if (mode === RegisterMode) {
      setPasswordFocused(false)
    }
  }

  const [buttonLabel, buttonProps] = React.useMemo((): [
    ButtonProps['label'],
    Omit<ButtonProps, 'label'>,
  ] => {
    if ([TwoFactorEmailMode, TwoFactorRequiredMode].includes(mode)) {
      return [
        translate('authDialog.playNow'),
        // Need click effect
        { loading: busy },
      ]
    }
    if (requiresPasswordReset) {
      return [
        translate('lostPasswordConfirm.continue'),
        {
          onClick: onRequiredPasswordResetContinue,
          loading: busy,
        },
      ]
    }
    if (mode === LoginMode && resetPassword) {
      return [
        !recoverPassword
          ? translate('authDialog.continue')
          : translate('authDialog.resetPassword'),
        {
          onClick: onResetPassword,
          loading: busy,
        },
      ]
    }
    if (mode === LoginMode && !resetPassword) {
      return [
        regionRestricted
          ? translate('authDialog.login')
          : translate('authDialog.playNow'),
        {
          'aria-label': 'Sign in',
          ref: loginButtonRef,
          onKeyDown: submitWithKey,
          loading: busy,
        },
      ]
    }

    if (mode === ResetMode && passwordRecovered) {
      return [
        translate('authDialog.login'),
        {
          onClick: onSubmitPasswordRecovered,
          loading: busy,
        },
      ]
    }
    return [
      primaryButtonName,
      {
        'aria-label': primaryButtonName,
        onKeyDown: submitWithKey,
        loading: busy,
      },
    ]
  }, [
    busy,
    mode,
    recoverPassword,
    regionRestricted,
    resetPassword,
    primaryButtonName,
    requiresPasswordReset,
    passwordRecovered,
  ])

  const validateUsername = React.useCallback(
    async (event: React.FocusEvent<HTMLInputElement>) => {
      const username = event.target.value
      // No need to send if user didn't type in anything
      if (username.length > 0) {
        try {
          const { usernameTaken } = await api.post<
            any,
            { usernameTaken: boolean }
          >('/auth/validateUsername', {
            username,
          })
          setUsernameTaken(usernameTaken)
          if (usernameTaken) {
            setFormError('username', translate('authDialog.usernameTaken'))
            return
          }
        } catch (error) {
          const errorMessage = (() => {
            if (isApiError(error)) {
              return error.message
            }
            return translate('authDialog.contactSupportError')
          })()
          setFormError('username', errorMessage)
          return
        }
      }
      clearErrors('username')
    },
    [],
  )

  const renderInputs = () => {
    if (requiresPasswordReset) {
      return null
    }
    if ([TwoFactorEmailMode, TwoFactorRequiredMode].includes(mode)) {
      return (
        <MultiBoxInput
          numBoxes={NUM_BOXES}
          boxValues={boxValues}
          setBoxValues={setBoxValues}
          submit={formSubmitHandler}
        />
      )
    }

    return (
      <>
        {mode !== ResetMode && (
          /*
           * Do not remove this is for our language parser (i8next-parser)
           * translate('authDialog.username')
           * translate('authDialog.usernameOrEmail')
           */
          <AuthDialogField
            defaultValue={defaultName}
            autoComplete="username"
            name="username"
            id="auth-dialog-username"
            ref={elem => {
              usernameRef.current = elem
              register(elem, { required: true })
            }}
            error={errors.username}
            disabled={busy}
            {...(mode === RegisterMode && { onBlur: validateUsername })}
            label={translate(
              mode === LoginMode
                ? 'authDialog.usernameOrEmail'
                : 'authDialog.username',
            )}
            placeholder={translate(
              mode === LoginMode
                ? 'authDialog.usernameOrEmail'
                : 'authDialog.username',
            )}
            onChange={handleRegistrationStart}
            handleSubmit={formSubmitHandler}
            {...(usernameTaken && {
              bottomMessage: errors.username?.message,
            })}
          />
        )}
        {recoverPassword && (
          <AuthDialogField
            name="recoveryCode"
            ref={elem => {
              recoveryCodeRef.current = elem
              register(elem, { required: true })
            }}
            error={errors.recoveryCode}
            disabled={busy}
            label={translate('authDialog.recoveryCode')}
            placeholder={translate('authDialog.recoveryCode')}
            handleSubmit={formSubmitHandler}
          />
        )}
        {showEmail && (
          <AuthDialogField
            name="email"
            ref={elem => {
              emailRef.current = elem
              register(elem, { required: true })
            }}
            type="email"
            error={errors.email}
            disabled={busy}
            label={translate('authDialog.emailAddress')}
            placeholder={translate('authDialog.emailAddress')}
            handleSubmit={formSubmitHandler}
            onChange={handleRegistrationStart}
          />
        )}
        {showPassword && (
          <div>
            <AuthDialogField
              autoComplete={
                recoverPassword ? 'new-password' : 'current-password'
              }
              id={
                recoverPassword
                  ? 'auth-dialog-new-password'
                  : 'auth-dialog-current-password'
              }
              ref={elem => {
                passwordRef.current = elem
                register(elem, { required: true })
              }}
              name="password"
              error={errors.password}
              type={!showPasswordText ? 'password' : 'text'}
              placeholder={translate('authDialog.password')}
              disabled={busy}
              onFocus={handleFocused}
              onBlur={handleBlur}
              label={
                !recoverPassword
                  ? translate('authDialog.password')
                  : translate('authDialog.newPassword')
              }
              endAdornment={
                <IconButton
                  aria-label={translate('authDialog.togglePasswordVisibility')}
                  className={classes.PasswordVisibilityButton}
                  tabIndex={-1}
                  onClick={togglePasswordVisibility}
                  size="small"
                >
                  <FontAwesomeIcon
                    icon={!showPasswordText ? faEyeSlash : faEye}
                  />
                </IconButton>
              }
              handleSubmit={formSubmitHandler}
              onChange={handleRegistrationStart}
              {...(mode === RegisterMode && {
                bottomMessage: translate(
                  'authDialog.passwordLengthRequirement',
                ),
              })}
            />
          </div>
        )}
        {mode === LoginMode && (
          <Link
            component="button"
            // @ts-expect-error I think ui has incorrect interface
            disabled={busy}
            className={classes.Link}
            onClick={() => setMode(ResetMode)}
            underline="hover"
            type="button"
            color={uiTheme.palette.neutral[400]}
            variant="body4"
            fontWeight={uiTheme.typography.fontWeightBold}
            textAlign="start"
          >
            {translate('authDialog.forgotPassword')}
          </Link>
        )}
      </>
    )
  }

  const renderBackLoginButton =
    [ResetMode, TwoFactorEmailMode, TwoFactorRequiredMode].includes(mode) &&
    !passwordRecovered

  return (
    <>
      <PostAuthItems />
      <GenericAuthDialog
        pageTitle={pageTitle}
        header={header}
        subHeader={subheader}
        buttonLabel={buttonLabel}
        buttonProps={buttonProps}
        dismissible={isDialogDismissible(mode)}
        DialogProps={DialogProps}
        // key={`${mode}_${recoverPassword ? '_r' : ''}`}
        formSubmitHandler={formSubmitHandler}
        setMode={setMode}
        errorMessage={errorMessage}
        {...(renderBackLoginButton && { backToLoginButton: true })}
        {...(!createdAccount &&
          [LoginMode, RegisterMode].includes(mode) &&
          !requiresPasswordReset && {
            endContent: (
              <Socials
                mode={mode}
                busy={busy || resetPassword}
                recaptchaRef={recaptchaRef}
                setOauthUri={setOauthUri}
              />
            ),
          })}
      >
        <div className={classes.Form__inputFields}>{renderInputs()}</div>
        {[RegisterMode, SetUsernameMode].includes(mode) && (
          <div className={classes.CheckboxContainer}>
            <FormControlLabel
              control={
                <Checkbox
                  widthAndHeight={20}
                  required
                  onInvalid={evt =>
                    // I'm sorry for the type assertion, but this is technically correct.
                    (
                      evt as React.ChangeEvent<HTMLInputElement>
                    ).target.setCustomValidity(
                      translate('authDialog.ageErrorText'),
                    )
                  }
                  onChange={evt => evt.target.setCustomValidity('')}
                />
              }
              required
              name="age"
              disabled={busy}
              className={classes.CheckboxFormControl}
              label={
                <Typography
                  variant="body4"
                  color={uiTheme.palette.neutral[400]}
                >
                  {translate('authDialog.ageVerificationText')}
                </Typography>
              }
              inputRef={elem => {
                ageRef.current = elem
                register(elem, { required: true })
              }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  widthAndHeight={20}
                  required
                  onInvalid={evt =>
                    // I'm sorry for the type assertion, but this is technically correct.
                    (
                      evt as React.ChangeEvent<HTMLInputElement>
                    ).target.setCustomValidity(
                      translate('authDialog.readAndAccept'),
                    )
                  }
                  onChange={evt => evt.target.setCustomValidity('')}
                />
              }
              required
              name="tos"
              disabled={busy}
              className={classes.CheckboxFormControl}
              label={
                <Typography
                  variant="body4"
                  color={uiTheme.palette.neutral[400]}
                >
                  <Trans i18nKey="authDialog.iHaveReadAndAccept">
                    <Link
                      className={classes.Link}
                      target="_blank"
                      href="terms-and-conditions"
                      tabIndex={-1}
                      color={uiTheme.palette.neutral[400]}
                      fontWeight={uiTheme.typography.fontWeightBold}
                      underline="hover"
                      textAlign="start"
                    />
                    <Link
                      className={classes.Link}
                      target="_blank"
                      href="privacy-policy"
                      tabIndex={-1}
                      color={uiTheme.palette.neutral[400]}
                      fontWeight={uiTheme.typography.fontWeightBold}
                      underline="hover"
                      textAlign="start"
                    />
                    <Link
                      className={classes.Link}
                      target="_blank"
                      href="responsible-gambling"
                      tabIndex={-1}
                      color={uiTheme.palette.neutral[400]}
                      fontWeight={uiTheme.typography.fontWeightBold}
                      underline="hover"
                      textAlign="start"
                    />
                  </Trans>
                </Typography>
              }
              inputRef={elem => {
                tosRef.current = elem
                register(elem, { required: true })
              }}
            />
          </div>
        )}
      </GenericAuthDialog>
      <ReCaptcha
        ref={recaptchaRef}
        size="invisible"
        sitekey="6LcyLZQUAAAAALOaIzlr4pTcnRRKEQn-d6sQIFUx"
        onErrored={() => {
          toast.error(translate('authDialog.recaptchaError'))
        }}
        onChange={onRecaptchaChange}
      />
    </>
  )
}

export const AuthDialog = React.memo(AuthDialogView)
