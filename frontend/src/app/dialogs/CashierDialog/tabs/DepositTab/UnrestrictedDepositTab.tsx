import React from 'react'
import { useSelector } from 'react-redux'
import { Link, theme as uiTheme, Chip, Tooltip } from '@project-atl/ui'
import { Instant, Checkmark } from '@project-atl/ui/assets'

import {
  type CryptoNetwork,
  isCashOption as isCashOptionTypeGaurd,
} from 'app/constants'
import { useCashierOptions, useTranslate, useFeatures } from 'app/hooks'
import { type BalanceType } from 'common/types'

import {
  CashDepositOption,
  RippleDepositOption,
  CryptoDepositOptionMap,
} from './options'
import {
  BalanceDropdown,
  BlockTemplate,
  DescriptionTemplate,
} from '../../templates'

import { useDepositTabStyles } from './DepositTab.styles'

interface UnrestrictedDepositTabProps {
  userId: string
  sessionId: string
  setErrorMessage: React.Dispatch<React.SetStateAction<string | null>>
}

const CONFIRMATIONS_TEXT: Record<Exclude<BalanceType, 'cash'>, string> = {
  // t('depositTab.btcConfirmationRequired')
  crypto: 'depositTab.btcConfirmationRequired',
  // t('depositTab.threeConfirmationsRequired')
  eth: 'depositTab.threeConfirmationsRequired',
  ltc: 'depositTab.threeConfirmationsRequired',
  doge: 'depositTab.threeConfirmationsRequired',
  usdc: 'depositTab.threeConfirmationsRequired',
  usdt: 'depositTab.threeConfirmationsRequired',
  // t('depositTab.oneConfirmationRequired')
  xrp: 'depositTab.oneConfirmationRequired',
  // t('depositTab.twentyConfirmationsRequired')
  trx: 'depositTab.twentyConfirmationsRequired',
}

const NETWORK_TEXT: Record<CryptoNetwork, string> = {
  // t('depositTab.ethereumNetworkTooltip')
  ETH: 'depositTab.ethereumNetworkTooltip',
}

export const UnrestrictedDepositTab: React.FC<UnrestrictedDepositTabProps> = ({
  userId,
  sessionId,
  setErrorMessage,
}) => {
  const classes = useDepositTabStyles()
  const translate = useTranslate()

  const [hasReadRippleWarning, setHasReadRippleWarning] =
    React.useState<boolean>(false)

  const { allCashierOptions } = useCashierOptions({ cashierWalletNames: true })

  const selectedBalanceType = useSelector(
    ({ balances }) =>
      balances?.selectedBalanceType || allCashierOptions[0].balanceType,
  )
  const { allowed: isPaymentIQAllowed } = useFeatures(['paymentiq'])

  const selectedCashierOption =
    allCashierOptions.find(
      option => option.balanceType === selectedBalanceType,
    ) ?? allCashierOptions[0]

  const isCashOption = isCashOptionTypeGaurd(selectedCashierOption)

  const filteredCashierOptions = allCashierOptions.filter(
    option =>
      option.balanceType !== 'cash' ||
      (option.balanceType === 'cash' && isPaymentIQAllowed),
  )

  // Reset error message when switching currencies
  React.useEffect(() => {
    setErrorMessage(null)
  }, [selectedCashierOption])

  return (
    <>
      <DescriptionTemplate title={translate('depositTab.selectWallet')} />
      <BlockTemplate>
        <BalanceDropdown
          customCashierOptions={filteredCashierOptions}
          selectedCashierOption={selectedCashierOption}
        />
        {!isCashOption && (
          <div className={classes.ChipContainer}>
            {/** Only BTC is instant */}
            {selectedCashierOption.instant && (
              <Tooltip
                title={translate('depositTab.btcInstant')}
                placement="top"
              >
                <div>
                  <Chip
                    label={translate('depositTab.instant')}
                    color="secondary"
                    size="small"
                    icon={<Instant />}
                  />
                </div>
              </Tooltip>
            )}
            {selectedCashierOption.network && (
              <Tooltip
                title={translate(NETWORK_TEXT[selectedCashierOption.network])}
                placement="top"
              >
                <div>
                  <Chip
                    label={translate('depositTab.network', {
                      network: selectedCashierOption.network,
                    })}
                    color="default"
                    size="small"
                  />
                </div>
              </Tooltip>
            )}
            <Tooltip
              title={translate(CONFIRMATIONS_TEXT[selectedBalanceType])}
              placement="top"
            >
              <div>
                <Chip
                  label={
                    selectedCashierOption.confirmations === 1
                      ? translate('depositTab.confirmation')
                      : translate('depositTab.confirmations', {
                          confirmations: selectedCashierOption.confirmations,
                        })
                  }
                  color="primary"
                  size="small"
                  icon={<Checkmark />}
                />
              </div>
            </Tooltip>
          </div>
        )}
      </BlockTemplate>
      {(selectedBalanceType !== 'xrp' ||
        (selectedBalanceType === 'xrp' && hasReadRippleWarning)) && (
        <DescriptionTemplate
          title={
            isCashOption
              ? translate('depositTab.sendCash')
              : translate('depositTab.depositAddress')
          }
          subtext={
            isCashOption
              ? translate('depositTab.preferredPaymentMethod')
              : translate('depositTab.sendAnyAmount', {
                  crypto: selectedCashierOption.crypto,
                })
          }
        />
      )}
      <BlockTemplate
        {...(selectedBalanceType === 'cash' && {
          contentContainerClassName: classes.ContentContainer_cashBackground,
        })}
      >
        {isCashOption ? (
          <CashDepositOption userId={userId} sessionId={sessionId} />
        ) : selectedCashierOption.balanceType === 'xrp' ? (
          <RippleDepositOption
            cashierOption={selectedCashierOption}
            hasReadWarning={hasReadRippleWarning}
            setHasReadWarning={setHasReadRippleWarning}
          />
        ) : (
          CryptoDepositOptionMap[selectedCashierOption.balanceType]({
            cashierOption: selectedCashierOption,
            setErrorMessage,
          })
        )}
      </BlockTemplate>
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
        {translate('depositTab.havingTroubleDepositing')}
      </Link>
    </>
  )
}
