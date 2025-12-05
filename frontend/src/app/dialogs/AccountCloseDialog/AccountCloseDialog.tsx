import React from 'react'
import { Helmet } from 'react-helmet'
import {
  Button,
  Typography,
  theme as uiTheme,
  InputField,
} from '@project-atl/ui'
import makeStyles from '@mui/styles/makeStyles'
import createStyles from '@mui/styles/createStyles'

import { useTranslate } from 'app/hooks'
import { useAxiosPost, useToasts } from 'common/hooks'
import { type DialogProps } from 'app/types'

import { DialogWithBottomNavigation } from '../DialogWithBottomNavigation'

export const useAccountCloseDialogStyles = makeStyles(() =>
  createStyles({
    AccountCloseDialog: {
      [uiTheme.breakpoints.up('md')]: {
        '& .MuiPaper-root': {
          maxWidth: '385px',
        },
      },
    },

    AccountCloseDialog__content: {
      display: 'flex',
      flexDirection: 'column',
      padding: uiTheme.spacing(2),
      gap: uiTheme.spacing(1.5),
      margin: uiTheme.spacing(2),
      backgroundColor: uiTheme.palette.neutral[800],
      borderRadius: '12px',

      [uiTheme.breakpoints.up('md')]: {
        padding: uiTheme.spacing(3.5),
        gap: uiTheme.spacing(2),
        borderRadius: 0,
        margin: 0,
      },
    },

    ButtonContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: uiTheme.spacing(1),
      zIndex: 2,
      justifyContent: 'flex-end',

      [uiTheme.breakpoints.up('md')]: {
        gap: uiTheme.spacing(1.5),
        flexDirection: 'row',
        alignItems: 'flex-end',
      },
    },

    ButtonContainer__button: {
      width: '100%',

      [uiTheme.breakpoints.up('md')]: {
        width: '128px',
      },
    },
  }),
)

export const AccountCloseDialog: React.FC<{
  DialogProps: DialogProps
}> = React.memo(({ DialogProps }) => {
  const classes = useAccountCloseDialogStyles()
  const translate = useTranslate()
  const { toast } = useToasts()

  const [password, setPassword] = React.useState('')

  const [deleteAccount, { loading }] = useAxiosPost('/account/deleteAccount', {
    onError: error =>
      toast.error(
        // @ts-expect-error TODO Axios error interface
        error.response ? error.response.data : error.message,
      ),
  })

  const submitWithEnter = event => {
    if (event.KeyCode === 13 || event.code === 'Enter') {
      event.preventDefault()
      deleteAccount({ variables: { password } })
    }
  }

  return (
    <DialogWithBottomNavigation
      {...DialogProps}
      className={classes.AccountCloseDialog}
      maxWidth="md"
      fullWidth
      showCloseInTitle
      title={translate('accountCloseDialog.accountClosure')}
      handleClose={DialogProps.onClose}
    >
      <Helmet title={translate('accountCloseDialog.accountClosure')} />
      <div className={classes.AccountCloseDialog__content}>
        <Typography
          variant="body2"
          color={uiTheme.palette.neutral[400]}
          fontWeight={uiTheme.typography.fontWeightMedium}
        >
          {translate('accountCloseDialog.enterPassword')}
        </Typography>
        <InputField
          color="secondary"
          disabled={loading}
          type="password"
          size="medium"
          value={password}
          onChange={event => setPassword(event.target.value)}
          onKeyDown={submitWithEnter}
          placeholder="************"
          fullWidth
          label={translate('accountCloseDialog.password')}
        />
        <div className={classes.ButtonContainer}>
          <Button
            className={classes.ButtonContainer__button}
            disabled={loading}
            onClick={() => DialogProps.onClose()}
            size="large"
            variant="text"
            label={translate('accountCloseDialog.cancel')}
          />
          <Button
            className={classes.ButtonContainer__button}
            loading={loading}
            disabled={loading || !password.length}
            onClick={() => deleteAccount({ variables: { password } })}
            size="large"
            color="primary"
            variant="contained"
            label={translate('accountCloseDialog.close')}
            borderOutline
          />
        </div>
      </div>
    </DialogWithBottomNavigation>
  )
})
