import React from 'react'
import { useSelector } from 'react-redux'

import { isDevelopmentBalanceType, type User } from 'common/types'

import {
  CryptoOptions,
  CashOptions,
  type CashierOption,
  type CryptoOption,
  type CashOption,
} from '../constants'

const filteredDevelopmentOptions = <T extends CashierOption>(
  options: T[],
  flags: Record<string, boolean> | null,
) => {
  return options.filter(option => {
    const { balanceType } = option
    if (isDevelopmentBalanceType(balanceType)) {
      if (flags) {
        // coercing in case this is undefined
        return !!flags[balanceType]
      } else {
        return false
      }
    }
    return true
  })
}

export const useCashierOptions = ({
  cashierWalletNames = false,
}: { cashierWalletNames?: boolean } = {}) => {
  const flags = useSelector(({ settings }) => settings?.flags || null)

  const addressCountry = useSelector(
    ({ user }: { user?: User }) => user?.kyc?.addressCountry,
  )

  const cashOptionAccess = useSelector(
    ({ user }: { user?: User }) => !!user?.systemSettings?.cashOptions?.enabled,
  )

  const options = React.useMemo(() => {
    const filteredCryptoOptions = filteredDevelopmentOptions<CryptoOption>(
      [...CryptoOptions],
      flags,
    )
    const filteredCashOptions =
      // Override in order to disable cash deposit/withdraw options
      cashOptionAccess
        ? filteredDevelopmentOptions<CashOption>(
            [...CashOptions(cashierWalletNames, addressCountry)],
            flags,
          )
        : []

    const allCashierOptions: CashierOption[] = [
      ...filteredCryptoOptions,
      ...filteredCashOptions,
    ]

    return {
      cashOptions: !!cashOptionAccess && filteredCashOptions,
      cryptoOptions: filteredCryptoOptions,
      allCashierOptions,
    }
  }, [flags, addressCountry, cashierWalletNames, cashOptionAccess])

  return options
}
