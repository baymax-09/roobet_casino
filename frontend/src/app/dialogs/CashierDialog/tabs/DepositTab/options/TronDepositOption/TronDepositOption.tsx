import React from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import QRCode from 'qrcode.react'
import { useQuery } from '@apollo/client'
import { Button, Typography, theme as uiTheme } from '@project-atl/ui'

import { useTranslate } from 'app/hooks'
import { CurrentUserTronWalletQuery } from 'app/gql'

import { type CryptoDepositOptionProps } from '../CryptoDepositOption'
import CryptoDepositOptionView from '../CryptoDepositOption/CryptoDepositOptionView'
import { useDepositTabStyles } from '../../DepositTab.styles'

interface CryptoDepositQueryData {
  currentUser: {
    tronUserWallet: {
      address: string
      id: string
      type: 'tron'
      nonce: number
      userId: string
    }
  }
}

const TronDepositOptionView: React.FC<CryptoDepositOptionProps> = ({
  cashierOption,
  setErrorMessage,
  ...props
}) => {
  const translate = useTranslate()
  const classes = useDepositTabStyles()

  const [copied, setCopied] = React.useState<boolean>(false)

  const { data: tronWallet, loading } = useQuery<CryptoDepositQueryData>(
    CurrentUserTronWalletQuery,
  )

  const address = tronWallet?.currentUser.tronUserWallet.address ?? ''
  const qrCodeValue = address

  React.useEffect(() => {
    if (!copied) {
      return
    }
    const timeout = setTimeout(() => setCopied(false), 3000)
    return () => clearTimeout(timeout)
  }, [copied])

  const onCopy = React.useCallback(() => setCopied(true), [])

  return (
    <>
      <CryptoDepositOptionView
        {...{
          ...props,
          cashierOption,
          loading,
        }}
        qr={
          <div className={classes.QRContainer}>
            <QRCode className={classes.QR} value={qrCodeValue} />
          </div>
        }
        fields={[
          <Typography
            variant="body2"
            fontWeight={uiTheme.typography.fontWeightBold}
          >
            {`${translate('depositTab.your')} ${translate(
              'depositTab.address',
            )}`}
          </Typography>,
          <Typography
            variant="body4"
            fontWeight={uiTheme.typography.fontWeightMedium}
            color={uiTheme.palette.neutral[200]}
            sx={{ overflowWrap: 'anywhere' }}
          >
            {address}
          </Typography>,
        ]}
        actions={[
          <CopyToClipboard key="copy" text={address}>
            <Button
              disabled={loading}
              color="tertiary"
              fullWidth
              variant="contained"
              size="large"
              onClick={onCopy}
              label={
                copied
                  ? translate('depositTab.copied')
                  : translate('depositTab.copyAddress')
              }
            ></Button>
          </CopyToClipboard>,
        ]}
      />
    </>
  )
}

export const TronDepositOption = React.memo(TronDepositOptionView)
