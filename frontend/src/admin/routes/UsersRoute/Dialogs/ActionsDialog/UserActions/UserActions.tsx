import React, { Fragment } from 'react'
import {
  Button,
  ClickAwayListener,
  TextField,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import SyncIcon from '@mui/icons-material/Sync'
import { Form, Formik } from 'formik'

import { api, isApiError } from 'common/util'
import { useConfirm, useToasts } from 'common/hooks'
import { useAccessControl, useBalanceTypes } from 'admin/hooks'
import { withRulesAccessController } from 'admin/components'
import { type UserData } from 'admin/routes/UsersRoute/types'

import { useUserActionsStyles } from './UserActions.styles'

interface UserActionsProps {
  userData: UserData
  updateUserData: (callback: (userData: UserData) => void) => void
  closeSession: () => void
  refreshSession?: () => void
  isActiveSession: boolean
}

const LogoutUserButtonAccess = withRulesAccessController(
  ['account:logout'],
  Button,
)
const VerifyEmailButtonAccess = withRulesAccessController(
  ['account:send_verify_email'],
  Button,
)
const ResetLoginAttemptsButtonAccess = withRulesAccessController(
  ['account:update_login_attempt'],
  Button,
)
const FixEmailButtonAccess = withRulesAccessController(
  ['account:fix_email'],
  Button,
)
const UpdateBetGoalButtonAccess = withRulesAccessController(
  ['account:update_bet_goal'],
  Button,
)

export const UserActions: React.FC<UserActionsProps> = props => {
  const {
    userData,
    updateUserData,
    closeSession,
    refreshSession,
    isActiveSession,
  } = props

  const { hasAccess: hasDeleteAccountButtonAccess } = useAccessControl([
    'account:delete',
  ])
  const { hasAccess: has2FAUpdateAccess } = useAccessControl([
    'account:update_2fa',
  ])
  const { hasAccess: hasNameChangeUpdateAccess } = useAccessControl([
    'account:update_name',
  ])
  const { hasAccess: hasAffiliateCutUpdateAccess } = useAccessControl([
    'account:update_affiliate_cut',
  ])
  const { hasAccess: hasChangeEmailUpdateAccess } = useAccessControl([
    'account:update_email',
  ])

  const { user } = userData
  const hasEmail = user.emailVerified && !!user.email && user.email.length

  const classes = useUserActionsStyles()
  const confirm = useConfirm()

  const [errorMessage, setErrorMessage] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [openTooltip, setOpenTooltip] = React.useState(false)
  const [showCustomAffiliateCutModal, setShowCustomAffiliateCutModal] =
    React.useState(false)
  const { toast } = useToasts()

  const balanceTypesFetched = useBalanceTypes()

  const showVerificationInput = () => {
    confirm<{ code: string }>({
      title: 'Verification Code',
      message: `Enter the verification code that was sent to "${user.email}"`,
      inputs: [
        {
          type: 'text',
          key: 'code',
          name: 'Code',
        },
      ],
    })
      .then(params => {
        setBusy(true)

        return api.post<{ userId: string; code: string }, { success: boolean }>(
          '/admin/user/validate2FACode',
          {
            userId: user.id,
            code: params.code,
          },
        )
      })
      .then(
        ({ success }) => {
          if (!success) {
            throw new Error('Invalid verification code')
          }
          setBusy(false)
          if (success) {
            setErrorMessage(
              'Verification code matched and identity has been confirmed',
            )
            setOpenTooltip(true)
          }
        },
        () => {
          setBusy(false)
        },
      )
      .catch(err => {
        setBusy(false)
        setErrorMessage(err.message)
        setOpenTooltip(true)
      })
  }

  const sendVerification = () => {
    setOpenTooltip(false)

    if (!hasEmail) {
      setErrorMessage('User must have a verified email first')
      setOpenTooltip(true)
      return
    }

    setBusy(true)

    api
      .post('/admin/user/send2FACode', {
        userId: user.id,
      })
      .then(() => {
        setBusy(false)
        showVerificationInput()
      })
      .catch(err => {
        setBusy(false)
        setErrorMessage(err.message)
        setOpenTooltip(true)
      })
  }

  const deleteAccount = async () => {
    try {
      await confirm({
        title: 'Delete Account',
        message: (
          <span>
            Are you sure you want to delete this account? <br />
            <b>
              This action <u>CANNOT</u> be reversed!
            </b>
          </span>
        ),
      })
    } catch (err) {
      return
    }
    try {
      await api.post('admin/user/deleteAccount', {
        userId: user.id,
      })
      toast.success('Account has been deleted!')
      closeSession()
    } catch (err) {
      if (isApiError(err)) {
        toast.error(err.message)
      } else {
        toast.error('Unknown error.')
      }
    }
  }

  const remove2FA = async () => {
    try {
      await confirm({
        title: 'Remove 2FA',
        message: (
          <span>
            Are you sure you want to remove 2FA? <br />
            <b>
              This action <u>CANNOT</u> be reversed!
            </b>
          </span>
        ),
      })
    } catch (err) {
      return
    }

    try {
      setBusy(true)

      await api.post('admin/user/remove2FA', {
        userId: user.id,
      })

      updateUserData(ud => {
        ud.user.twofactorEnabled = false
      })
      toast.success('Removed 2FA')
    } catch (err) {
      if (isApiError(err)) {
        toast.error(err.message)
      } else {
        toast.error('Unknown error.')
      }
    } finally {
      setBusy(false)
    }
  }

  const resetBetGoal = async () => {
    try {
      const { reason, balanceType } = await confirm<{
        reason: string
        balanceType: string
      }>({
        title: 'Reset Bet Goal',
        message: "Are you sure you want to reset the user's bet goal?",
        inputs: [
          {
            type: 'select',
            key: 'balanceType',
            name: 'Balance Type',
            options: balanceTypesFetched.map(balanceType => ({
              key: balanceType,
              value: balanceType,
            })),
          },
          {
            type: 'text',
            key: 'reason',
            name: 'Reason',
          },
        ],
      })
      setBusy(true)
      await api.post('admin/user/resetBetGoal', {
        userId: user.id,
        reason,
        balanceType,
      })
      toast.success('Reset Bet Goal')
    } catch (err) {
      if (isApiError(err)) {
        toast.error(err.message)
      } else {
        toast.error('Unknown error.')
      }
    } finally {
      setBusy(false)
    }
  }

  const resetLoginAttempts = async () => {
    setBusy(true)

    try {
      await api.post('/admin/user/resetLoginAttempts', {
        userId: user.id,
      })
      toast.success('Login attempts for this user have been reset!')
    } catch (err) {
      if (isApiError(err)) {
        toast.error(err.message)
      } else {
        toast.error('Unknown error.')
      }
    } finally {
      setBusy(false)
    }
  }

  const logoutUserFromAllSessions = async () => {
    try {
      await confirm({
        title: 'Logout User',
        message: (
          <span>
            Are you sure you want to logout this user from all sessions?
          </span>
        ),
      })
    } catch (err) {
      return
    }

    setBusy(true)

    try {
      await api.post('/admin/user/logoutUserFromAllSessions', {
        userId: user.id,
      })
      toast.success('User has been logged out from all sessions!')
    } catch (err) {
      if (isApiError(err)) {
        toast.error(err.message)
      } else {
        toast.error('Unknown error.')
      }
    } finally {
      setBusy(false)
    }
  }

  const clearEmailSuppressions = async () => {
    setBusy(true)

    try {
      await api.post('/admin/users/deleteSuppressions', {
        email: user.email,
      })
      toast.success('Email Suppressions Cleared!')
    } catch (err) {
      if (isApiError(err)) {
        toast.error(err.message)
      } else {
        toast.error('Unknown error.')
      }
    } finally {
      setBusy(false)
    }
  }

  const changeName = React.useCallback(() => {
    confirm<{ name: string }>({
      title: 'Name Change',
      message: (
        <span>
          Please enter a new name for <b>{userData.user.name}</b>
        </span>
      ),
      inputs: [
        {
          type: 'text',
          key: 'name',
          name: 'Name',
          helperText: 'Name is case sensitive',
          defaultValue: userData.user.name,
        },
      ],
    }).then(({ name: newUsername }) => {
      setBusy(true)

      return api
        .post('admin/user/changeUsername', {
          newUsername,
          userId: user.id,
        })
        .then(
          () => {
            updateUserData(ud => {
              ud.user.name = newUsername
            })
            toast.success(`Users name has been changed to ${newUsername}`)
            setBusy(false)
          },
          err => {
            toast.error(err.message)
            setBusy(false)
          },
        )
    })
  }, [userData])

  const changeEmail = React.useCallback(() => {
    confirm<{ email: string }>({
      title: 'Email Change',
      message: (
        <span>
          Please enter a new email for <b>{userData.user.name}</b>
        </span>
      ),
      inputs: [
        {
          type: 'text',
          key: 'email',
          name: 'Email',
          defaultValue: userData.user.email,
        },
      ],
    }).then(({ email: newEmail }) => {
      setBusy(true)

      return api
        .post('admin/user/changeEmail', {
          newEmail,
          userId: user.id,
        })
        .then(
          () => {
            updateUserData(ud => {
              ud.user.email = newEmail
            })
            toast.success('Changed Email')
            setBusy(false)
          },
          err => {
            toast.error(err.message)
            setBusy(false)
          },
        )
    })
  }, [userData])

  const submitCustomAffiliateCut = (values, { setErrors }) => {
    setBusy(true)

    api
      .post('/admin/user/setCustomAffiliateCut', {
        userId: userData.user.id,
        customAffiliateCut: values.amount,
      })
      .then(response => {
        updateUserData(ud => {
          ud.user.customAffiliateCut =
            values.amount !== 0 ? values.amount : false
        })
        toast.success(`Set Custom Affiliate Cut to ${values.amount}`)
        setShowCustomAffiliateCutModal(false)
      })
      .catch(error => {
        toast.error(error.response.data)
      })
      .finally(() => {
        setBusy(false)
      })
  }

  // @ts-expect-error TODO userData can technically be a Rethink user or a Mongo user from archivedUser collection
  if (user.isDeleted) {
    return null
  }

  return (
    <>
      <Button
        disabled={!isActiveSession}
        color="primary"
        variant="contained"
        onClick={refreshSession}
        startIcon={<SyncIcon />}
      >
        <span>Refresh</span>
      </Button>
      <ClickAwayListener onClickAway={() => setOpenTooltip(false)}>
        <Tooltip
          placement="top"
          PopperProps={{
            disablePortal: true,
          }}
          onClose={() => setOpenTooltip(false)}
          open={openTooltip}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          title={errorMessage}
        >
          <Button
            disabled={busy}
            onClick={sendVerification}
            variant="contained"
            color="primary"
            className={classes.verifyButtonGroup}
          >
            Send Email Code
          </Button>
        </Tooltip>
      </ClickAwayListener>
      <VerifyEmailButtonAccess
        variant="contained"
        disabled={busy}
        color="primary"
        onClick={event => {
          event.preventDefault()

          if (!hasEmail) {
            setOpenTooltip(false)
            setErrorMessage('User must have a verified email first')
            setOpenTooltip(true)
            return
          }

          showVerificationInput()
        }}
        className={classes.verifyButtonGroup}
      >
        Verify Email Code
      </VerifyEmailButtonAccess>

      {has2FAUpdateAccess && ( // user.twofactorEnabled &&
        <Button
          disabled={busy}
          onClick={remove2FA}
          variant="contained"
          color="primary"
          className={classes.quickActionButtonGroup}
        >
          Remove 2FA
        </Button>
      )}
      {hasNameChangeUpdateAccess && (
        <>
          <Button
            disabled={busy}
            variant="contained"
            onClick={changeName}
            className={classes.quickActionButtonGroup}
          >
            Change Name
          </Button>
        </>
      )}
      {hasAffiliateCutUpdateAccess && (
        <>
          <Button
            disabled={busy}
            variant="contained"
            onClick={() => setShowCustomAffiliateCutModal(true)}
            className={classes.quickActionButtonGroup}
          >
            Set Custom Affiliate Cut
          </Button>
        </>
      )}

      {(hasChangeEmailUpdateAccess || !user.emailVerified) && (
        <Button
          disabled={busy}
          variant="contained"
          onClick={changeEmail}
          className={classes.quickActionButtonGroup}
        >
          Change Email
        </Button>
      )}
      <ResetLoginAttemptsButtonAccess
        disabled={busy}
        variant="contained"
        onClick={resetLoginAttempts}
        className={classes.quickActionButtonGroup}
      >
        Reset Login Attempts
      </ResetLoginAttemptsButtonAccess>
      <FixEmailButtonAccess
        disabled={busy}
        variant="contained"
        onClick={clearEmailSuppressions}
        className={classes.quickActionButtonGroup}
      >
        Fix Email
      </FixEmailButtonAccess>
      <UpdateBetGoalButtonAccess
        disabled={busy}
        variant="contained"
        onClick={resetBetGoal}
        className={classes.quickActionButtonGroup}
      >
        Reset Bet Goal
      </UpdateBetGoalButtonAccess>
      <LogoutUserButtonAccess
        disabled={busy}
        variant="contained"
        onClick={logoutUserFromAllSessions}
        className={classes.deleteAccountButtonGroup}
      >
        Logout User
      </LogoutUserButtonAccess>
      {hasDeleteAccountButtonAccess && (
        <Button
          className={classes.deleteAccountButtonGroup}
          disabled={busy}
          color="primary"
          variant="contained"
          onClick={deleteAccount}
        >
          Delete Account
        </Button>
      )}

      <Dialog
        open={showCustomAffiliateCutModal}
        onClose={() => setShowCustomAffiliateCutModal(false)}
      >
        <DialogTitle>Set Custom Affiliate Cut</DialogTitle>
        <Formik
          initialValues={{
            amount: '',
          }}
          onSubmit={submitCustomAffiliateCut}
        >
          {({ values, errors, handleChange }) => (
            <Form className={classes.dialogForm}>
              <DialogContent>
                <TextField
                  variant="standard"
                  name="amount"
                  value={values.amount}
                  onChange={handleChange}
                  helperText={errors.amount}
                  error={!!errors.amount}
                  placeholder="0 for disabled"
                  type="number"
                  fullWidth
                />
              </DialogContent>
              <DialogActions>
                <Button type="submit">Submit</Button>

                <Button onClick={() => setShowCustomAffiliateCutModal(false)}>
                  Cancel
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </>
  )
}
