import { types, unionTypes } from './types'
import { mutationFields } from './mutationFields'
import { queryFields } from './queryFields'

export const ProductGraph = [
  // Types.
  types.AddressLookupType,
  types.CurrencySettingsType,
  types.DisplayCurrencyEnumType,
  types.ExchangeRatesType,
  types.GameTagType,
  types.MessageType,
  types.NotificationType,
  types.PlayerTagType,
  types.RaffleEntryType,
  types.RippleDestinationTagType,
  types.SlotPotatoType,
  types.TPGameType,
  types.TronUserWalletType,
  types.UserPublicProfileType,
  types.UserSystemStatusType,
  types.RakeboostType,
  types.UserType,
  types.WithdrawalFeeType,

  // Union Types.
  unionTypes.NotificationMessageType,

  // Root Mutation Fields.
  mutationFields.AddressLookupMutationField,
  mutationFields.MessageMarkAsReadMutationField,
  mutationFields.NotificationMarkAsReadMutationField,
  mutationFields.PlayerTagCreateMutationField,
  mutationFields.TPGameStartGameMutationField,
  mutationFields.TPGameToggleFavoriteMutationField,
  mutationFields.UserCurrencySettingsMutationField,

  // Root Query Fields.
  queryFields.CurrentUserQueryField,
  queryFields.ExchangeRatesQueryField,
  queryFields.GameTagsQueryField,
  queryFields.NotificationsQueryField,
  queryFields.SlotPotatoActiveQueryField,
  queryFields.TPGameQueryField,
  queryFields.TPGamesGetAllProductQueryField,
  queryFields.TPGamesQueryField,
  queryFields.UserPublicProfileQueryField,
  queryFields.UserSystemStatusQueryField,
  queryFields.WithdrawalFeeQueryField,
]
