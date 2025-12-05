import React, { useCallback } from 'react'
import { type DialogProps as MuiDialogProps } from '@mui/material'
import { useSelector } from 'react-redux'
import { useMutation } from '@apollo/client'
import { Button, type DialogProps as UxDialogProps } from '@project-atl/ui'
import { Helmet } from 'react-helmet'

import { useTranslate } from 'app/hooks'
import { useToasts } from 'common/hooks'
import {
  CurrencySettingsMutation,
  type CurrencySettingsMutationInput,
  type CurrencySettingsMutationReturn,
} from 'app/gql/currencySettings'

import { CurrencyDisplayForm } from './Elements/CurrencyDisplayForm'
import { HideEmptyWallets } from './Elements/HideEmptyWallets'
import { WalletSettingsHeader } from './Elements/WalletSettingsHeader'
import { DialogWithBottomNavigation } from '../DialogWithBottomNavigation'

import { useWalletSettingsStyles } from './WalletSettings.styles'

interface WalletSettingsDialogProps {
  DialogProps: UxDialogProps & MuiDialogProps
}

export const WalletSettingsDialog: React.FC<WalletSettingsDialogProps> = ({
  DialogProps,
}) => {
  const { displayCurrency, hideEmptyBalances } = useSelector(
    ({ user }) => user?.systemSettings.currency,
  )
  const [currency, setCurrency] = React.useState(displayCurrency || 'usd')
  const [hideEmpty, setHideEmpty] = React.useState(hideEmptyBalances || false)
  const classes = useWalletSettingsStyles()
  const translate = useTranslate()
  const { toast } = useToasts()

  const onClose = () => {
    if (DialogProps && DialogProps.handleClose) {
      DialogProps.handleClose()
    }
    if (DialogProps && DialogProps.onClose) {
      DialogProps.onClose({}, 'escapeKeyDown')
    }
  }

  const [userSystemSettingsMutation, loading] = useMutation<
    CurrencySettingsMutationReturn,
    CurrencySettingsMutationInput
  >(CurrencySettingsMutation, {
    onError: () => {
      toast.error(translate('walletSettings.errorOnUpdate'))
    },
    onCompleted: () => {
      onClose()
    },
  })

  const delta = currency !== displayCurrency || hideEmpty !== hideEmptyBalances

  const onSubmit = useCallback(() => {
    userSystemSettingsMutation({
      variables: {
        data: { displayCurrency: currency, hideEmptyBalances: hideEmpty },
      },
    })
  }, [userSystemSettingsMutation, hideEmpty, currency])

  return (
    <DialogWithBottomNavigation
      maxWidth="md"
      fullWidth
      showCloseInTitle={true}
      disableEnforceFocus
      {...DialogProps}
      title={translate('walletSettings.title')}
      handleClose={onClose}
      className={classes.WalletSettings}
    >
      <>
        <Helmet title={translate('walletSettings.title')} />
        <div className={classes.WalletSettings_content}>
          <WalletSettingsHeader />
          <CurrencyDisplayForm defaultValue={currency} onChange={setCurrency} />
          <HideEmptyWallets defaultValue={hideEmpty} onChange={setHideEmpty} />
        </div>
        <div className={classes.WalletSettings__actions}>
          <Button
            label={translate('walletSettings.save')}
            variant="contained"
            size="large"
            type="submit"
            color="primary"
            onClick={onSubmit}
            disabled={loading.loading || !delta}
            loading={!!loading.loading}
            className={classes.WalletSettings__button}
          />
        </div>
      </>
    </DialogWithBottomNavigation>
  )
}
