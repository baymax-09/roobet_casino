import { objectType } from 'nexus'

export const BlockioCurrentBlockType = objectType({
  name: 'BlockioCurrentBlock',
  description: 'Current Blockio block number',
  definition(type) {
    type.nonNull.int('height')
  },
})
