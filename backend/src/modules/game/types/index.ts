export * from './ActiveGame'
export * from './GameRound'
export * from './GameQueue'
export * from './Error'
export * from './Verify'

const LegacyHouseGameNames = [
  'roulette',
  'towers',
  'dice',
  'crash',
  'mines',
] as const
export type LegacyHouseGameName = (typeof LegacyHouseGameNames)[number]

const LegacyHouseGameIdentifiers = [
  'housegames:roulette',
  'housegames:towers',
  'housegames:dice',
  'housegames:crash',
  'housegames:mines',
] as const
export type LegacyHouseGameIdentifier =
  (typeof LegacyHouseGameIdentifiers)[number]

export const isLegacyHouseGameName = (
  value: any,
): value is LegacyHouseGameName => LegacyHouseGameNames.includes(value)

export const isLegacyHouseGameIdentifier = (
  value: any,
): value is LegacyHouseGameIdentifier =>
  LegacyHouseGameIdentifiers.includes(value)

const NewHouseGameNames = [
  'plinko',
  'hotbox',
  'cashdash',
  'coinflip',
  'junglemines',
  'linearmines',
] as const
export type NewHouseGameName = (typeof NewHouseGameNames)[number]
export const isNewHouseGameName = (value: any): value is NewHouseGameName =>
  NewHouseGameNames.includes(value)

const NewHouseGameIdentifiers = [
  'housegames:Plinko',
  'housegames:hotbox',
  'luckypengwin:yetiCashDash',
  'housegames:coinflip',
  'housegames:junglemines',
  'housegames:linearmines',
] as const
export type NewHouseGameIdentifier = (typeof NewHouseGameIdentifiers)[number]

const TPHouseGameIdentifiers = [
  ...NewHouseGameIdentifiers,
  ...LegacyHouseGameIdentifiers,
] as const
export type TPHouseGameIdentifier = (typeof TPHouseGameIdentifiers)[number]

const TPHouseGameNames = [
  ...NewHouseGameNames,
  ...LegacyHouseGameNames,
] as const
export type TPHouseGameName = (typeof TPHouseGameNames)[number]
export const isTPHouseGameName = (value: any): value is TPHouseGameName =>
  TPHouseGameNames.includes(value)

export const HouseGameNames = [
  'mines',
  'crash',
  'hilo',
  'linearmines',
  'coinflip',
  'cashdash',
  'junglemines',
  'blackjack',
  ...NewHouseGameNames,
  ...LegacyHouseGameNames,
] as const
export const HouseGameWithHistory = [
  'mines',
  'towers',
  'plinko',
  'hilo',
  'linearmines',
  'coinflip',
  'cashdash',
  'junglemines',
] as const
const HouseGamesWithRoundTables = [
  'mines',
  'towers',
  'dice',
  'plinko',
  'hilo',
  'linearmines',
  'coinflip',
  'cashdash',
  'junglemines',
  'blackjack',
] as const

const HouseGamesWithVerifications = [
  'mines',
  'towers',
  'dice',
  'plinko',
  'linearmines',
  'crash',
  'hotbox',
  'roulette',
  'coinflip',
  'cashdash',
  'junglemines',
  'blackjack',
  'hilo',
] as const

export type HouseGameName = (typeof HouseGameNames)[number]

export type HouseGamesWithRoundTable =
  (typeof HouseGamesWithRoundTables)[number]

export type HouseGamesWithVerification =
  (typeof HouseGamesWithVerifications)[number]

export const isHouseGameName = (value: any): value is HouseGameName =>
  HouseGameNames.includes(value)

export const isHouseWithVerificationGameName = (
  value: any,
): value is HouseGamesWithVerification =>
  HouseGamesWithVerifications.includes(value)
