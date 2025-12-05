import { queryField, idArg, stringArg } from 'nexus'

import { getRaffle } from 'src/modules/raffle/documents/raffle'

export const RaffleQueryField = queryField('raffle', {
  type: 'Raffle',
  args: { raffleId: idArg(), slug: stringArg() },
  auth: {
    authenticated: true,
    accessRules: [{ resource: 'raffles', action: 'read' }],
  },
  resolve: async (_, { raffleId, slug }) => await getRaffle(raffleId || slug),
})
