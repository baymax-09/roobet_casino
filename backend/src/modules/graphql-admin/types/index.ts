import { BetActivityType } from './betActivity'
import { BlockioCurrentBlockType } from './blockioCurrentBlock'
import {
  BonusCodeType,
  BonusCodeTypeSettingsInputType,
  BonusCodeTypeSettingsType,
  BonusCodeTypeType,
  FreeSpinsTypeSettingsType,
  TPGameAggregatorType,
} from './bonusCode'
import { CMSContentType } from './cmsContent'
import { GameTagType } from './gameTag'
import {
  UserInventoryItemType,
  HouseInventoryItemType,
  ArchivedInventoryItemType,
} from './inventoryItem'
import {
  ItemBuffSettingsType,
  FreeBetBuffSettingsType,
  FreeSpinGameType,
  FreeSpinsBuffType,
  FreeSpinsBuffSettingsType,
  RoowardsBuffSettingsType,
  ItemBuffType,
  EmoteBuffSettingsType,
} from './itemBuff'
import { ItemBuffInputType } from './itemBuffInput'
import { ItemRewardType } from './itemReward'
import { ItemUsageInputType } from './itemUsageSettingsInput'
import { KYCRecordType } from './kyc'
import { MessageDetailedType, MessageType } from './message'
import { MessageTemplateType } from './messageTemplate'
import { QuestType } from './quest'
import {
  QuestCriteriaSettingsType,
  QuestTemplateType,
  PageViewQuestSettingsType,
  NewPlayerIncentiveQuestSettingsType,
} from './questTemplate'
import { RaffleType } from './raffle'
import { RaffleEntryType } from './raffleEntry'
import { RBACPolicyType } from './rbacPolicy'
import { RBACRoleType } from './rbacRole'
import { RippleDestinationTagType } from './rippleDestinationTag'
import { SlotPotatoType } from './slotPotato'
import { TPGameAdminType } from './tpGameAdmin'
import {
  TPGamesAdminGetPaginatedResponseType,
  TPGamesFilterType,
} from './tpGameAdminPaginated'
import { TPGameBlockType } from './tpGameBlock'
import { TPGameMetadataType } from './tpGameMetadata'
import { UserType } from './user'
import { TronUserWalletType } from './tronUserWallet'
import { WithdrawalType } from './withdrawal'
import { RakeboostType } from './rakeboost'

// For Nexus Gen
export type { CMSContentDocument as DBCMSContent } from 'src/modules/cms/documents'
export type { RBACRole as DBRole } from 'src/modules/rbac/documents/RBACRoles'
export type { RBACPolicy as DBPolicy } from 'src/modules/rbac/documents/RBACPolicies'
export type { Raffle as DBRaffle } from 'src/modules/raffle/documents/raffle'
export type { SlotPotato as DBSlotPotato } from 'src/modules/slotPotato/documents/slotPotato'
export type { DBWithdrawal } from 'src/modules/withdraw/documents/withdrawals_mongo'
export type { BonusCode as DBBonusCode } from 'src/modules/crm/documents'
export { type DBUser as DBUserAdmin } from 'src/modules/user/types/User'
export {
  type UserPortfolio as DBUserPortfolio,
  type UserPortfolioBalances as DBUserBalances,
  type PortfolioBalance as DBUserPortfolioBalances,
} from 'src/modules/user/types/Portfolio'
export type { KYCRecord as DBKYCRecord } from 'src/modules/fraud/kyc/types/KYC'
export type {
  KycVerificationFailure as DBKycVerificationFailure,
  KycVerificationLevelResult as DBKycVerificationLevelResult,
} from 'src/modules/fraud/kyc/types/Verification'
export type { TPBlock as DBTPGameBlocks } from 'src/modules/tp-games/documents/blocks'
export type { TPGame as DBTPGame } from 'src/modules/tp-games/documents/games'
export type { GameTag as DBGameTag } from 'src/modules/tp-games/documents/gameTags'
export type { MessageTemplateDocument as DBMessageTemplate } from 'src/modules/messaging/messages/documents/messageTemplate'
export type { Message as DBMessage } from 'src/modules/messaging/messages/documents/message'
export type { InventoryItemReward as DBInventoryItemReward } from 'src/modules/inventory/lib'
export type { Quest as DBQuest } from 'src/modules/inventory/lib'
export type { QuestTemplate as DBQuestTemplate } from 'src/modules/inventory/lib'
export type { DBRakeBoost } from 'src/modules/rewards/documents/rakeboost'

export interface RaffleEntry {
  raffleId: string
  name: string
  tickets: number
}

export const types = {
  ArchivedInventoryItemType,
  BetActivityType,
  BlockioCurrentBlockType,
  BonusCodeType,
  BonusCodeTypeSettingsInputType,
  BonusCodeTypeType,
  CMSContentType,
  FreeSpinGameType,
  FreeSpinsBuffType,
  FreeSpinsTypeSettingsType,
  GameTagType,
  HouseInventoryItemType,
  ItemBuffInputType,
  ItemRewardType,
  ItemUsageInputType,
  KYCRecordType,
  MessageDetailedType,
  MessageTemplateType,
  MessageType,
  QuestTemplateType,
  QuestType,
  RaffleEntryType,
  RaffleType,
  RBACPolicyType,
  RBACRoleType,
  RippleDestinationTagType,
  SlotPotatoType,
  TPGameAdminType,
  TPGameAggregatorType,
  TPGameBlockType,
  TPGameMetadataType,
  TPGamesAdminGetPaginatedResponseType,
  TPGamesFilterType,
  TronUserWalletType,
  UserInventoryItemType,
  UserType,
  WithdrawalType,
  RakeboostType,
}

export const unionTypes = {
  BonusCodeTypeSettingsType,
  EmoteBuffSettingsType,
  FreeBetBuffSettingsType,
  FreeSpinsBuffSettingsType,
  ItemBuffSettingsType,
  ItemBuffType,
  NewPlayerIncentiveQuestSettingsType,
  PageViewQuestSettingsType,
  QuestCriteriaSettingsType,
  RoowardsBuffSettingsType,
}
