import { enumType, objectType } from 'nexus'
import { RakeBoostTypes } from 'src/modules/rewards/types'

const RakeboostEnumType = enumType({
  name: 'RakeboostType',
  description: 'The type of effect in place.',
  members: RakeBoostTypes,
})

export const RakeboostType = objectType({
  name: 'RakeBoost',
  sourceType: {
    module: __dirname,
    export: 'DBRakeBoost',
  },
  definition(type) {
    type.nonNull.id('id', {
      auth: null,
      resolve: ({ _id }) => _id.toString(),
    })
    type.nonNull.nonEmptyString('userId')
    type.nonNull.date('startTime')
    type.nonNull.date('endTime')
    type.nonNull.positiveInt('rakebackPercentage')
    type.nonNull.positiveInt('totalEarned')
    type.nonNull.field('type', {
      auth: null,
      type: RakeboostEnumType,
    })
  },
})
