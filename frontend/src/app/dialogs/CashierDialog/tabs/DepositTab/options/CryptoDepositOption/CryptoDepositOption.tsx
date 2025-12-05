import React from 'react'
import { TextField } from '@mui/material'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import QRCode from 'qrcode.react'
import { useQuery } from '@apollo/client'
import { utils } from 'ethers'
import { Button, Typography, theme as uiTheme } from '@project-atl/ui'

import { useTranslate, useFeatureFlags, useCurrencyFormatter } from 'app/hooks'
import { useEthers, type EthersPayload } from 'app/hooks/useEthers'
import { api } from 'common/util'
import { ExchangeRatesQuery } from 'app/gql/exchangeRates'
import metamask from 'assets/images/icons/metamask.svg'
import { ERC20CodeToFullname } from 'common/types/balanceTypes'
import { type CryptoOption } from 'app/constants'

import CryptoDepositOptionView from './CryptoDepositOptionView'
import { useDepositTabStyles } from '../../DepositTab.styles'

export interface CryptoDepositOptionProps {
  cashierOption: CryptoOption
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>
}

const CryptoDeposit: React.FC<CryptoDepositOptionProps> = ({
  cashierOption,
  setErrorMessage,
  ...props
}) => {
  const translate = useTranslate()
  const classes = useDepositTabStyles()
  const exchangeAndFormatCurrency = useCurrencyFormatter()
  const { allowed: isMetamaskDepositAllowed } = useFeatureFlags([
    'metamaskIntegration',
  ])

  const [copied, setCopied] = React.useState<boolean>(false)
  const [state, setState] = React.useState({
    loading: true,
    result: undefined,
    address: '',
  })
  const [depositValue, setDepositValue] = React.useState<string>('')
  const [ethersError, setEthersError] = React.useState<string>('')

  const [{ account }, { connect, createTx }]: EthersPayload = useEthers(
    isMetamaskDepositAllowed,
  )
  const { data: exchangeRatesData } = useQuery<{
    data: { exchangeRates: { eth: string } }
  }>(ExchangeRatesQuery, {
    skip: !isMetamaskDepositAllowed,
  })

  const requestNewAddress = React.useCallback(() => {
    setState(prevState => ({
      ...prevState,
      loading: true,
      result: undefined,
    }))
    setErrorMessage(null)

    api
      .post<{ crypto: string }, { address: string }>(
        '/crypto/createNewWallet',
        {
          crypto: cashierOption.crypto,
        },
      )
      .then(({ address }) => {
        setState(prevState => ({ ...prevState, address }))
      })
      .catch(err => {
        const error = err.response ? err.response.data : err.message
        setErrorMessage(error)
      })
      .then(() => setState(prevState => ({ ...prevState, loading: false })))
  }, [cashierOption.crypto, setErrorMessage])

  React.useEffect(() => {
    setState(prevState => ({
      ...prevState,
      loading: true,
      error: undefined,
    }))

    // TODO: change this to a get route, like /wallet/{eth/btc/ltc/etc}
    api
      .post<{ crypto: string }, { address: string }>('/crypto/getWallet', {
        crypto: cashierOption.crypto,
      })
      .then(response => {
        setState(prevState => ({
          ...prevState,
          loading: false,
          address: response.address,
        }))
      })
      .catch(err => {
        const error = err.response ? err.response.data : err.message
        setErrorMessage(error)
      })
      .then(() => {
        setState(prevState => ({ ...prevState, loading: false }))
      })
    /**
     * The popover state causes modal to rerender which causes the api to throw
     * which causes the pop up trigger over and over
     * do not put resultPopOverState into the dependency array
     **/
  }, [cashierOption.balanceType, cashierOption.crypto, setErrorMessage])

  React.useEffect(() => {
    if (!copied) {
      return
    }
    const timeout = setTimeout(() => setCopied(false), 3000)
    return () => clearTimeout(timeout)
  }, [copied])

  const onCopy = React.useCallback(() => setCopied(true), [])

  const handleConnectMetamask = async () => {
    if (account.primary) {
      return
    }

    await connect()
  }

  const promptMetamaskEtherSend = (event, amount?: string) => {
    if (ethersError) {
      setEthersError('')
    }

    if (!state.address || !account.primary || !exchangeRatesData) {
      return
    }

    const {
      exchangeRates: { eth: ethToUSD },
    }: any = exchangeRatesData
    const valueUSD = Number(amount) || Number(depositValue)
    const accountBalanceUSD = convertEthToUSD(account.balance)
    setDepositValue(valueUSD.toFixed(2).toLocaleString())
    if (valueUSD > accountBalanceUSD) {
      setEthersError(translate('ethers.insufficientEther'))
      return
    }

    const txValueEth = Number(valueUSD) / Number(ethToUSD)
    const newTx = {
      to: state.address,
      from: account.primary,
      value: utils.parseEther(txValueEth.toString()),
      chainId: process.env.NODE_ENV === 'production' ? 0x1 : 0x5, // 0x1 for mainnet and 0x5 for Goerli testnet
    }

    createTx(newTx)
    setDepositValue('')
  }

  const handleAmountInput = event => setDepositValue(event.target.value)

  const handleAmountInputFormat = event => {
    if (ethersError) {
      setEthersError('')
    }

    let val = Number(event.target.value).toFixed(2).toLocaleString()

    val = val === '0.00' ? '' : val

    setDepositValue(val)
  }

  const convertEthToUSD = (balance: string) => {
    if (!exchangeRatesData) {
      return 0
    }
    const {
      exchangeRates: { eth: ethToUSD },
    }: any = exchangeRatesData

    return Number(ethToUSD) * Number(balance)
  }

  const formatUSD = (value: number) => '$' + value.toFixed(2).toLocaleString()
  const abbreviateAddress = (address: string) =>
    address.slice(0, 6) +
    '....' +
    address.slice(address.length - 4, address.length)
  const showEthereumOption =
    isMetamaskDepositAllowed &&
    (cashierOption.balanceType === 'eth' ||
      ERC20CodeToFullname[cashierOption.balanceType]) &&
    !account.primary
  const qrCodeValue = state.address

  return (
    <>
      <CryptoDepositOptionView
        {...{
          ...props,
          cashierOption,
          loading: state.loading,
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
            {state.address}
          </Typography>,
          isMetamaskDepositAllowed &&
            cashierOption.balanceType === 'eth' &&
            !!account?.primary && (
              <div className={classes.depositInputColumn}>
                <div className={classes.accountDetailsRow}>
                  <img alt="Metamask" width="24" height="24" src={metamask} />
                  <span>
                    <p>{abbreviateAddress(account.primary)}</p>
                    <p style={{ fontWeight: 'bold', marginLeft: '3rem' }}>
                      {formatUSD(convertEthToUSD(account.balance))}
                    </p>
                  </span>
                </div>
                <div className={classes.depositInputRow}>
                  <div className={classes.quickDepositButtons}>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => promptMetamaskEtherSend({}, '25.00')}
                      label={exchangeAndFormatCurrency(25, '0,0.00')}
                    />
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => promptMetamaskEtherSend({}, '50.00')}
                      label={exchangeAndFormatCurrency(50, '0,0.00')}
                    />
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => promptMetamaskEtherSend({}, '100.00')}
                      label={exchangeAndFormatCurrency(100, '0,0.00')}
                    />
                  </div>
                  <div className={classes.customInputRow}>
                    <TextField
                      variant="standard"
                      key="amount"
                      placeholder="Custom Amount"
                      size="small"
                      error={!!ethersError}
                      helperText={ethersError}
                      value={depositValue}
                      onChange={handleAmountInput}
                      onBlur={handleAmountInputFormat}
                      label="USD"
                    />
                    <Button
                      size="small"
                      color="primary"
                      onClick={promptMetamaskEtherSend}
                      label={translate('depositTab.deposit')}
                    />
                  </div>
                </div>
              </div>
            ),
        ]}
        actions={[
          (cashierOption.balanceType === 'crypto' ||
            cashierOption.balanceType === 'ltc' ||
            cashierOption.balanceType === 'doge') && (
            <Button
              disabled={state.loading}
              size="large"
              fullWidth
              color="tertiary"
              variant="contained"
              onClick={requestNewAddress}
              label={translate('depositTab.requestNewAddress')}
            />
          ),
          showEthereumOption && (
            <Button
              disabled={state.loading}
              size="large"
              fullWidth
              color="tertiary"
              variant="contained"
              onClick={handleConnectMetamask}
              startIcon={
                <img alt="Metamask" width="24" height="24" src={metamask} />
              }
              label={translate('depositTab.depositFromMetamask')}
            />
          ),
          <CopyToClipboard key="copy" text={state.address}>
            <Button
              disabled={state.loading}
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

export const CryptoDepositOption = React.memo(CryptoDeposit)
