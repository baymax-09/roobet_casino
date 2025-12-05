import gql from 'graphql-tag'

import { type DisplayCurrency } from 'common/constants'

export const CurrencySettingsMutation = gql`
  mutation UserCurrencySettings($data: UserCurrencySettingsInput!) {
    userCurrencySettings(data: $data) {
      displayCurrency
      hideEmptyBalances
    }
  }
`

export interface CurrencySettingsMutationInput {
  data: {
    displayCurrency: DisplayCurrency
    hideEmptyBalances?: boolean
  }
}

export interface CurrencySettingsMutationReturn {
  userCurrencySettings: {
    displayCurrency: DisplayCurrency
    hideEmptyBalances: boolean
  }
}
