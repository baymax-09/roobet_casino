import React from 'react'
import { useQuery } from '@apollo/client'
import { List, ListItem } from '@mui/material'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import QRCode from 'qrcode.react'
import {
  Button,
  ListItemText,
  Typography,
  theme as uiTheme,
  Link,
} from '@project-atl/ui'

import { useTranslate } from 'app/hooks'
import { type CryptoOption } from 'app/constants'
import { CurrentUserCryptoDepositQuery } from 'app/gql'

import CryptoDepositOptionView from '../CryptoDepositOption/CryptoDepositOptionView'
import { useDepositTabStyles } from '../../DepositTab.styles'

interface CryptoDepositQueryData {
  currentUser: {
    rippleDestinationTag: {
      id: string
      type: 'ripple'
      destinationAddress: string
      destinationTag: number
    }
  }
}

interface RippleDepositOptionViewProps {
  cashierOption: CryptoOption
  hasReadWarning: boolean
  setHasReadWarning: React.Dispatch<React.SetStateAction<boolean>>
}

const RippleDepositOptionView: React.FC<RippleDepositOptionViewProps> = ({
  cashierOption,
  hasReadWarning,
  setHasReadWarning,
  ...props
}) => {
  const translate = useTranslate()
  const classes = useDepositTabStyles()

  const [copied, setCopied] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (!copied) {
      return
    }
    const timeout = setTimeout(() => setCopied(false), 3000)
    return () => clearTimeout(timeout)
  }, [copied])

  const onCopy = React.useCallback(() => setCopied(true), [])

  const { data: destinationTagData, loading } =
    useQuery<CryptoDepositQueryData>(CurrentUserCryptoDepositQuery)

  const destinationTag =
    destinationTagData?.currentUser.rippleDestinationTag.destinationTag ?? ''
  const destinationAddress =
    destinationTagData?.currentUser.rippleDestinationTag.destinationAddress ??
    ''
  const qrCodeValue = destinationAddress

  const handleAddressClick = () => setHasReadWarning(true)

  const content = hasReadWarning
    ? [
        <Typography
          variant="body2"
          fontWeight={uiTheme.typography.fontWeightBold}
        >
          {`${translate('depositTab.your')} ${translate('depositTab.address')}`}
        </Typography>,
        <Typography
          variant="body4"
          fontWeight={uiTheme.typography.fontWeightMedium}
          color={uiTheme.palette.neutral[200]}
          sx={{ overflowWrap: 'anywhere' }}
        >
          {destinationAddress}
        </Typography>,
        <Typography
          variant="body2"
          fontWeight={uiTheme.typography.fontWeightBold}
        >
          {translate('depositTab.destinationTagMemo')}
        </Typography>,
        <Typography
          variant="body4"
          fontWeight={uiTheme.typography.fontWeightMedium}
          color={uiTheme.palette.neutral[200]}
        >
          {destinationTag}
        </Typography>,
      ]
    : [
        <div className={classes.RippleWarningTextContainer}>
          <Typography
            variant="body1"
            fontWeight={uiTheme.typography.fontWeightBold}
          >
            {translate('depositTab.rippleDepositHelp1')}
          </Typography>
          <List disablePadding>
            <ListItem className={classes.RippleListItem} disableGutters>
              <ListItemText
                className={classes.RippleListItem__text}
                primaryTypographyProps={{
                  variant: 'body4',
                  color: uiTheme.palette.neutral[300],
                  fontWeight: uiTheme.typography.fontWeightMedium,
                }}
              >
                {`1. ${translate('depositTab.address')}`}
              </ListItemText>
            </ListItem>
            <ListItem className={classes.RippleListItem} disableGutters>
              <ListItemText
                className={classes.RippleListItem__text}
                primaryTypographyProps={{
                  variant: 'body4',
                  color: uiTheme.palette.neutral[300],
                  fontWeight: uiTheme.typography.fontWeightMedium,
                }}
              >
                {`2. ${translate('depositTab.rippleDestinationTagText')}`}
              </ListItemText>
            </ListItem>
          </List>
          <Typography
            variant="body4"
            color={uiTheme.palette.neutral[300]}
            fontWeight={uiTheme.typography.fontWeightMedium}
          >
            {translate('depositTab.rippleDepositHelp2')}
          </Typography>
          <Typography
            variant="body4"
            color={uiTheme.palette.neutral[300]}
            fontWeight={uiTheme.typography.fontWeightMedium}
          >
            {translate('depositTab.firstTimeBinance')}{' '}
            <Link
              className={classes.Link}
              variant="body4"
              color={uiTheme.palette.neutral[200]}
              underline="hover"
              type="button"
              textAlign="start"
              target="_blank"
              fontWeight={uiTheme.typography.fontWeightBold}
              href="https://help.roobet.com/en/collections/1470170-deposits"
            >
              {translate('depositTab.readHereFirst')}
            </Link>
          </Typography>
        </div>,
      ]

  const actions = hasReadWarning
    ? [
        <CopyToClipboard key="copy" text={destinationAddress}>
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
      ]
    : [
        <Button
          disabled={loading}
          color="tertiary"
          fullWidth
          variant="contained"
          size="large"
          onClick={handleAddressClick}
          label={translate('depositTab.showAddress')}
        />,
      ]

  return (
    <>
      <CryptoDepositOptionView
        {...{
          ...props,
          cashierOption,
          loading: loading || !destinationTagData,
        }}
        qr={
          hasReadWarning && (
            <div className={classes.QRContainer}>
              <QRCode className={classes.QR} value={qrCodeValue} />
            </div>
          )
        }
        fields={content}
        actions={actions}
        customFieldSkeletonProps={{ options: { height: 172 } }}
      />
    </>
  )
}

export const RippleDepositOption = React.memo(RippleDepositOptionView)
