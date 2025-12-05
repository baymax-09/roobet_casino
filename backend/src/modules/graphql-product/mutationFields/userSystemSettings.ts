import { GraphQLError } from 'graphql'
import { inputObjectType, mutationField, nonNull } from 'nexus'

import { isDisplayCurrency } from 'src/modules/user/types/DisplayCurrency'

import { updateSystemSettings } from 'src/modules/userSettings/documents/user_system_settings'

export const UserCurrencySettingsInputType = inputObjectType({
  name: 'UserCurrencySettingsInput',
  definition(type) {
    type.nonNull.field('displayCurrency', {
      auth: null,
      description: 'User currency display setting.',
      type: 'DisplayCurrency',
    })
    type.boolean('hideEmptyBalances', {
      auth: null,
      description: 'User hideEmptyBalances setting.',
    })
  },
})

export const UserCurrencySettingsMutationField = mutationField(
  'userCurrencySettings',
  {
    description: 'Modify a users currency settings.',
    type: nonNull('CurrencySettings'),
    auth: {
      authenticated: true,
    },
    args: { data: nonNull(UserCurrencySettingsInputType) },
    resolve: async (_, { data }, { user }) => {
      if (!user?.id) {
        throw new GraphQLError('user__invalid_id', {})
      }

      const { displayCurrency, hideEmptyBalances } = data

      if (!isDisplayCurrency(displayCurrency)) {
        throw new GraphQLError('api__invalid_param', {})
      }

      const results = await updateSystemSettings(user.id, {
        currency: {
          displayCurrency,
          ...(typeof hideEmptyBalances === 'boolean' && { hideEmptyBalances }),
        },
      })

      return results.currency
    },
  },
)
