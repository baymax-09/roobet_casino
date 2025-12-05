import { objectType, enumType, unionType, inputObjectType } from 'nexus'
import path from 'path'

import { ThirdParties } from 'src/modules/bet/types'

import { BonusCodeTypeValues } from 'src/modules/crm/types'

/** @todo move to own file */
export const TPGameAggregatorType = enumType({
  name: 'TPGameAggregator',
  description: 'The tp game aggregator that the free spins are used for.',
  members: ThirdParties,
})

/** @todo move to own file */
export const FreeSpinsTypeSettingsType = objectType({
  name: 'FreeSpinsTypeSettings',
  description: 'The settings for the Free Spins buff type.',
  definition(type) {
    type.nonNull.positiveFloat('amount', {
      auth: null,
      description:
        'The bet amount the user gets per spin (Represents bet level for softswiss games).',
    })
    type.nonNull.positiveInt('rounds', {
      auth: null,
      description:
        'The number of rounds that the user will receive for a game.',
    })
    type.nonNull.nonEmptyString('gameIdentifier', {
      auth: null,
      description: 'The game identifier that the free spins can be used on.',
    })
    type.nonNull.field('tpGameAggregator', {
      auth: null,
      description: 'The tp game aggregator that the free spins are used for.',
      type: 'TPGameAggregator',
    })
  },
  isTypeOf(data) {
    return Boolean(
      'amount' in data &&
        !!data?.amount &&
        'rounds' in data &&
        !!data?.rounds &&
        'gameIdentifier' in data &&
        !!data?.gameIdentifier &&
        'tpGameAggregator' in data &&
        !!data?.tpGameAggregator,
    )
  },
})

/** @todo move to own file */
export const BonusCodeTypeSettingsType = unionType({
  name: 'BonusCodeTypeSettings',
  description: 'The union type of all buff settings.',
  definition(type) {
    type.members('FreeSpinsTypeSettings')
  },
})

/** @todo move to own file */
export const BonusCodeTypeType = enumType({
  name: 'BonusCodeType',
  description: 'The type of bonus code.',
  members: BonusCodeTypeValues,
})

/** @todo move to own file */
export const BonusCodeType = objectType({
  name: 'BonusCode',
  sourceType: {
    module: path.resolve(__dirname),
    export: 'DBBonusCode',
  },
  definition(type) {
    type.nonNull.objectId('id', {
      auth: null,
      description: 'The unique identifier of this bonus code.',
      resolve: ({ _id }) => _id,
    })
    type.nonNull.nonEmptyString('name')
    type.nonNull.nonEmptyString('description')
    type.nonNull.field('type', {
      auth: null,
      description: 'The type of bonus code.',
      type: 'BonusCodeType',
    })
    type.nonNull.field('typeSettings', {
      auth: null,
      description:
        'The specific fields that are associated with a bonus code type.',
      type: BonusCodeTypeSettingsType,
    })
  },
})

/** @todo move to own file */
export const BonusCodeTypeSettingsInputType = inputObjectType({
  name: 'BonusCodeTypeSettingsInput',
  definition(type) {
    type.nonNull.positiveFloat('amount', {
      auth: null,
      description:
        'The bet amount the user gets per spin (Represents bet level for softswiss games).',
    })
    type.nonNull.positiveFloat('rounds', {
      auth: null,
      description:
        'The number of rounds that the user will receive for a game.',
    })
    type.nonNull.nonEmptyString('gameIdentifier', {
      auth: null,
      description: 'The game identifier that the free spins can be used on.',
    })
    type.nonNull.field('tpGameAggregator', {
      auth: null,
      description: 'The tp game aggregator that the free spins are used for.',
      type: 'TPGameAggregator',
    })
  },
})
