import { inputObjectType } from 'nexus'

const FreeSpinGamesInputType = inputObjectType({
  name: 'FreeSpinGamesInput',
  definition(type) {
    type.nonNull.string('identifier', {
      auth: null,
      description: 'The identifier associated with a game.',
    })
    type.string('pragmaticGameId', {
      auth: null,
      description:
        'The game id associated with a game (only needed for pragmatic TP games).',
    })
  },
})

const FreeSpinInputType = inputObjectType({
  name: 'FreeSpinInput',
  definition(type) {
    type.nonNull.string('tpGameAggregator', {
      auth: null,
      description: 'The aggregator that the free spins can be used for.',
    })
    type.nonNull.list.nonNull.field('games', {
      auth: null,
      description: 'The list of games that the free spins can be used on.',
      type: FreeSpinGamesInputType,
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

const ItemBuffSettingsInputType = inputObjectType({
  name: 'ItemBuffSettingsInput',
  definition(type) {
    type.list.nonNull.string('unlockedEmotes', {
      auth: null,
      description:
        'The list of chat emotes unlocked by this buff. Usable with the EMOTE buff type.',
    })
    type.list.nonNull.string('games', {
      auth: null,
      description:
        'The list of games that a free bet can be used on. Usable with the FREE_BET buff type.',
    })
    type.int('freeBetAmount', {
      auth: null,
      description: 'The amount that is applied to the free bet.',
    })
    type.string('freeBetType', {
      auth: null,
      description:
        'The type of currency that is used for the free bet. Matches with the BalanceType, type. (Ex. cash, crypto, eth, etc.)',
    })
    type.float('roowardsModifier', {
      auth: null,
      description:
        'The modifier for Roowards rakeback, as a percentage (e.g., 90 would increase the rakeback by 90%). Usable with the ROOWARDS buff type.',
    })
    type.list.nonNull.field('freeSpins', {
      auth: null,
      description: 'A list of free spin configurations based on the provider.',
      type: FreeSpinInputType,
    })
  },
})

export const ItemBuffInputType = inputObjectType({
  name: 'ItemBuffInput',
  definition(type) {
    type.nonNull.field('type', {
      auth: null,
      description: 'The type of buff.',
      type: 'ItemBuffType',
    })
    type.field('buffSettings', {
      auth: null,
      description:
        'The settings for this buff type. If this is left null, then there is no additional configuration required for this buff type.',
      type: ItemBuffSettingsInputType,
    })
  },
})
