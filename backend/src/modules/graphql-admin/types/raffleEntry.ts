import { objectType } from 'nexus'

export const RaffleEntryType = objectType({
  name: 'RaffleEntries',
  sourceType: {
    module: __dirname,
    export: 'RaffleEntry',
  },
  definition(type) {
    type.nonNull.id('id', {
      auth: null,
      resolve: ({ raffleId }) => raffleId,
    })
    type.nonNull.string('name')
    type.nonNull.int('tickets')
  },
})
