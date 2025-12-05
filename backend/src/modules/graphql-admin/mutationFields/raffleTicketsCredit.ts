import { mutationField, nonNull, idArg, intArg } from 'nexus'

import { getUserById } from 'src/modules/user'

import { addTickets } from 'src/modules/raffle/documents/raffleTicket'

export const RaffleTicketsCreditMutationField = mutationField(
  'creditRaffleTickets',
  {
    description: 'Credit raffle tickets to user for a specific raffle',
    type: 'User',
    args: {
      raffleId: nonNull(idArg()),
      userId: nonNull(idArg()),
      amount: nonNull(intArg()),
    },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'raffles', action: 'update' }],
    },
    resolve: async (_, { raffleId, userId, amount }) => {
      await addTickets(raffleId, userId, amount)
      return await getUserById(userId)
    },
  },
)
