import { AddressLookupType } from './addressLookup'
import { ExchangeRatesType } from './exchangeRates'
import { NotificationType } from './notification'
import { NotificationMessageType } from './notificationMessage'
import { PlayerTagType } from './playerTag'
import { UserPublicProfileType } from './publicProfile'
import {
  CurrencySettingsType,
  DisplayCurrencyEnumType,
} from './userSystemSettings'
import { UserSystemStatusType } from './userSystemStatus'
import { WithdrawalFeeType } from './withdrawalFee'
import { SlotPotatoType } from './slotPotato'
import { UserType } from './user'
import { RaffleEntryType } from './raffleEntry'
import { TronUserWalletType } from './tronUserWallet'
import { RippleDestinationTagType } from './rippleDestinationTag'
import { RakeboostType } from './rakeboost'
import { MessageType } from './message'
import { GameTagType } from './gameTag'
import { TPGameType } from './tpGame'
import { type Message } from 'src/modules/messaging/messages/documents/message'

export type { CryptoPrices as DBCryptoPrices } from 'src/modules/currency/documents/exchange_rates'
export type { Notification as DBNotification } from 'src/modules/messaging/notifications/documents'
export type { DBUser } from 'src/modules/user/types'
export type { SlotPotato as DBSlotPotato } from 'src/modules/slotPotato/documents/slotPotato'
export type { DBRakeBoost } from 'src/modules/rewards/documents/rakeboost'
export type { Message as DBMessage } from 'src/modules/messaging/messages/documents/message'
export type { GameTag as DBGameTag } from 'src/modules/tp-games/documents/gameTags'
export type { TPGame as DBTPGame } from 'src/modules/tp-games/documents/games'
export type ProductMessage = Omit<
  Message,
  'recipients' | 'recipientCount' | 'meta'
>

export interface RaffleEntry {
  raffleId: string
  name: string
  tickets: number
}

export const types = {
  AddressLookupType,
  CurrencySettingsType,
  DisplayCurrencyEnumType,
  ExchangeRatesType,
  GameTagType,
  MessageType,
  NotificationType,
  PlayerTagType,
  RaffleEntryType,
  RippleDestinationTagType,
  SlotPotatoType,
  TPGameType,
  TronUserWalletType,
  UserPublicProfileType,
  UserSystemStatusType,
  UserType,
  WithdrawalFeeType,
  RakeboostType,
}

export const unionTypes = {
  NotificationMessageType,
}
