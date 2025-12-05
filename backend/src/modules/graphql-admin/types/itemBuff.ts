import { objectType, unionType, enumType } from 'nexus'

const ItemBuffTypeType = enumType({
  name: 'ItemBuffType',
  description: 'The type of buff applicable on an inventory item.',
  members: [
    {
      name: 'FREE_BET',
      description:
        'The buff type for giving players a free bet, configurable with type FreeBetBuffSettings.',
    },
    {
      name: 'EMOTE',
      description:
        'The buff type for giving players a set of chat emotes, configurable with type EmoteBuffSettings.',
    },
    {
      name: 'ROOWARDS',
      description:
        'The buff type for giving players a rakeback boost from their Roowards, configurable with type RoowardsBuffSettings.',
    },
    {
      name: 'FREE_SPINS',
      description:
        'The buff type for giving free spins to users for specified third party games/providers.',
    },
  ],
})
/*
 * Unfortunately these aren't used anywhere else in the graph beside this union type however
 * I can't ship them as transitive dependencies. They need to be directly exported into the schema BEFORE the union type
 */
export const EmoteBuffSettingsType = objectType({
  name: 'EmoteBuffSettings',
  description: 'The settings for the Emote buff type.',
  isTypeOf(data) {
    return Boolean('unlockedEmotes' in data && !!data.unlockedEmotes?.length)
  },
  definition(type) {
    type.nonNull.list.nonNull.string('unlockedEmotes', {
      auth: null,
      description: 'The list of chat emotes unlocked by this buff.',
    })
  },
})

export const RoowardsBuffSettingsType = objectType({
  name: 'RoowardsBuffSettings',
  description: 'The settings for the ROOWARDS buff type.',
  isTypeOf(data) {
    return Boolean('roowardsModifier' in data && !!data?.roowardsModifier)
  },
  definition(type) {
    type.nonNull.float('roowardsModifier', {
      auth: null,
      description:
        'The modifier for Roowards rakeback, as a percentage (e.g., 90 would increase the rakeback by 90%).',
    })
  },
})

export const FreeBetBuffSettingsType = objectType({
  name: 'FreeBetBuffSettings',
  description: 'The settings for the Free Bet buff type.',
  isTypeOf(data) {
    return Boolean(
      'games' in data &&
        !!data.games?.length &&
        'freeBetAmount' in data &&
        data.freeBetAmount &&
        'freeBetType' in data &&
        data.freeBetType,
    )
  },
  definition(type) {
    type.nonNull.list.nonNull.string('games', {
      auth: null,
      description: 'The list of games that a free bet can be used on.',
    })
    type.nonNull.int('freeBetAmount', {
      auth: null,
      description: 'The amount that is applied to the free bet.',
    })
    type.nonNull.string('freeBetType', {
      auth: null,
      description:
        'The type of currency that is used for the free bet. Matches with the BalanceType, type. (Ex. cash, crypto, eth, etc.)',
    })
  },
})

export const FreeSpinGameType = objectType({
  name: 'FreeSpinGame',
  description:
    'Contains the game ids for TP games. pragmaticGameId is only used for pragmatic games',
  definition(type) {
    type.nonNull.string('identifier', {
      auth: null,
      description: 'The identifier associated with the game.',
    })
    type.string('pragmaticGameId', {
      auth: null,
      description:
        'The game id associated with a game (only needed for pragmatic TP games).',
    })
  },
})

export const FreeSpinsBuffType = objectType({
  name: 'FreeSpinsBuff',
  description: 'The settings for the Free Spins buff type.',
  definition(type) {
    type.nonNull.string('tpGameAggregator', {
      auth: null,
      description: 'The aggregator that the free spins can be used for.',
    })
    type.nonNull.list.nonNull.field('games', {
      auth: null,
      description: 'The list of games that the free spins can be used on.',
      type: 'FreeSpinGame',
    })
    type.nonNull.int('numberOfSpins', {
      auth: null,
      description: 'The number of spins that the user will be allowed to use.',
    })
    type.nonNull.float('spinAmount', {
      auth: null,
      description:
        'The amount that the user gets to bet per spin (Represents bet level for softswiss games).',
    })
  },
})

export const FreeSpinsBuffSettingsType = objectType({
  name: 'FreeSpinsBuffSettings',
  description:
    'The settings for the Free Spins buff type. Contains a list of all the provider/games configuration',
  isTypeOf(data) {
    return Boolean('freeSpins' in data && !!data.freeSpins?.length)
  },
  definition(type) {
    type.nonNull.list.nonNull.field('freeSpins', {
      auth: null,
      type: 'FreeSpinsBuff',
      description: 'A list of free spin configurations based on the provider.',
    })
  },
})

export const ItemBuffSettingsType = unionType({
  name: 'ItemBuffSettings',
  description: 'The union type of all buff settings.',
  definition(type) {
    type.members(
      EmoteBuffSettingsType,
      FreeBetBuffSettingsType,
      RoowardsBuffSettingsType,
      FreeSpinsBuffSettingsType,
    )
  },
})

export const ItemBuffType = objectType({
  name: 'ItemBuff',
  description:
    'The configuration for a buff, indicating its type and settings.',
  definition(type) {
    type.nonNull.field('type', {
      auth: null,
      description: 'The type of buff.',
      type: ItemBuffTypeType,
    })
    type.field('buffSettings', {
      auth: null,
      description:
        'The settings for this buff type. If this is left null, then there is no additional configuration required for this buff type.',
      type: ItemBuffSettingsType,
    })
  },
})
