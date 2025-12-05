import {
  DevelopmentBalanceTypes,
  DevelopmentTokenTypes,
} from 'src/modules/user/balance'

/**
 * List of feature names that are currently in use.
 *
 * By default, all users will not have access to this feature.
 */
export const AVAILABLE_FEATURES = [
  'housegames:DiceReskin',
  'housegames:roulette',
  'housegames:coinflip',
  'housegames:linearmines',
  'housegames:coinflipNative',
  'housegames:towers-native',
  'housegames:mines-native',
  'twilioPhoneNumber',
  'oauth',
  'rewardsRedesign',
  ...DevelopmentBalanceTypes,
  ...DevelopmentTokenTypes,
] as const
