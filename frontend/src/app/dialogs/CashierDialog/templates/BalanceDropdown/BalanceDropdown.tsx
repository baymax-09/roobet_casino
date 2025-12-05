import React from 'react'
import { shallowEqual, useSelector } from 'react-redux'
import {
  Dropdown,
  Typography,
  type DropdownProps,
  theme as uiTheme,
} from '@project-atl/ui'

import { useCashierOptions, useCurrencyFormatter } from 'app/hooks'
import { roundBalance } from 'app/util'
import { setBalanceType } from 'app/lib/user'
import { type CashierOption, isCashOption } from 'app/constants'

import { useBalanceDropdownStyles } from './BalanceDropdown.styles'

interface BalanceDropdownProps
  extends Omit<DropdownProps, 'renderValue' | 'menuOptions' | 'onChange'> {
  customCashierOptions?: CashierOption[]
  selectedCashierOption: CashierOption
  onChange?: (event: any) => void
  hideBalance?: boolean
}

export const BalanceDropdown: React.FC<BalanceDropdownProps> = ({
  customCashierOptions,
  selectedCashierOption,
  onChange,
  hideBalance = false,
  ...props
}) => {
  const classes = useBalanceDropdownStyles()
  const exchangeAndFormatCurrency = useCurrencyFormatter()

  const userBalances = useSelector(({ balances }) => balances, shallowEqual)
  const selectedBalanceType = selectedCashierOption.balanceType

  const { allCashierOptions, cryptoOptions } = useCashierOptions({
    cashierWalletNames: true,
  })

  const onWalletChange = React.useCallback(
    event => {
      if (onChange) {
        onChange(event)
        return
      }
      const balanceType = allCashierOptions.reduce(
        (acc, b) =>
          b.balanceType === event.target.value ? b.balanceType : acc,
        allCashierOptions[0].balanceType,
      )
      setBalanceType(balanceType)
    },
    [allCashierOptions, onChange],
  )

  const menuOptions = customCashierOptions ?? cryptoOptions

  const isCashierOption = isCashOption(selectedCashierOption)

  return (
    <Dropdown
      fullWidth
      color="secondary"
      value={selectedBalanceType}
      {...props}
      onChange={onWalletChange}
      renderValue={() => (
        <div className={classes.BalanceDropdown}>
          <img
            className={classes.BalanceDropdown__balanceImg}
            src={selectedCashierOption.image}
            alt={selectedBalanceType}
          />
          <Typography
            className={classes.BalanceDropdown__cryptoName}
            variant="body2"
            fontWeight={uiTheme.typography.fontWeightBold}
          >
            {isCashierOption ? (
              <>
                {selectedCashierOption.walletName}
                <div className={classes.PaymentIcons}>
                  {selectedCashierOption.paymentIcons.map(payment => (
                    <img
                      key={payment.alt}
                      className={classes.PaymentIcons__icon}
                      style={{ width: payment.width }}
                      src={payment.icon}
                      alt={payment.alt}
                    />
                  ))}
                </div>
              </>
            ) : (
              selectedCashierOption?.crypto
            )}
          </Typography>
          {!isCashierOption && (
            <Typography
              variant="body4"
              fontWeight={uiTheme.typography.fontWeightMedium}
              color={uiTheme.palette.neutral[500]}
            >
              {selectedCashierOption?.shortCode.toUpperCase()}
            </Typography>
          )}
          {!hideBalance && (
            <div className={classes.BalanceDropdown__balance}>
              <Typography
                variant="body2"
                fontWeight={uiTheme.typography.fontWeightMedium}
                color={uiTheme.palette.success[500]}
              >
                {exchangeAndFormatCurrency(
                  roundBalance(userBalances[selectedBalanceType] || 0),
                  '0,0.00',
                )}
              </Typography>
            </div>
          )}
        </div>
      )}
      menuOptions={menuOptions.map(option => ({
        name: (
          <div className={classes.BalanceDropdown}>
            <img
              className={classes.BalanceDropdown__balanceImg}
              src={option.image}
              alt={option.balanceType}
            />
            <Typography
              className={classes.BalanceDropdown__cryptoName}
              variant="body2"
              fontWeight={uiTheme.typography.fontWeightBold}
            >
              {isCashOption(option) ? (
                <>
                  {option.walletName}
                  <div className={classes.PaymentIcons}>
                    {option.paymentIcons.map(payment => (
                      <img
                        key={payment.alt}
                        className={classes.PaymentIcons__icon}
                        style={{ width: payment.width }}
                        src={payment.icon}
                        alt={payment.alt}
                      />
                    ))}
                  </div>
                </>
              ) : (
                option?.crypto
              )}
            </Typography>
            {!hideBalance && (
              <div className={classes.BalanceDropdown__balance}>
                <Typography
                  variant="body2"
                  fontWeight={uiTheme.typography.fontWeightMedium}
                  color={uiTheme.palette.success[500]}
                >
                  {exchangeAndFormatCurrency(
                    roundBalance(userBalances[option.balanceType] || 0),
                    '0,0.00',
                  )}
                </Typography>
              </div>
            )}
          </div>
        ),
        value: option.balanceType,
      }))}
      menuItemProps={{ includeCheck: true }}
    />
  )
}
