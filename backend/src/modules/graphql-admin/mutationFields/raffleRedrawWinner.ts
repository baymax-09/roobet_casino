// TODO the guts of this operation should be encapsulated by a function defined in the raffle module
import { GraphQLError } from 'graphql'
import { mutationField, nonNull, idArg } from 'nexus'

import { populateRaffleForUser, drawWinners } from 'src/modules/raffle/lib/ops'
import { bustAllRaffleCacheData } from 'src/modules/raffle/lib/cache'
import { getRaffle } from 'src/modules/raffle/documents/raffle'

export const RaffleRedrawWinnerMutationField = mutationField(
  'redrawRaffleWinner',
  {
    description: 'Redraw the winner to a specific raffle',
    type: 'Raffle',
    args: {
      raffleId: nonNull(idArg()),
      userId: nonNull(idArg()),
    },
    auth: {
      authenticated: true,
      accessRules: [{ resource: 'raffles', action: 'update' }],
    },

    resolve: async (_, body, ctx) => {
      const { raffleId, userId } = body
      const raffle = await getRaffle(raffleId)
      const user = ctx.user

      if (!user) {
        throw new GraphQLError('No user found with that id')
      }

      if (!raffle) {
        throw new GraphQLError('Could not find specified raffle.')
      }

      if (!raffle.winners || raffle.winners.length === 0) {
        throw new GraphQLError(
          'Winners have not been drawn for specified raffle.',
        )
      }

      const existingWinners = new Set(raffle.winners)

      if (!existingWinners.delete(userId)) {
        throw new GraphQLError('Could not re-draw non-existing winner.')
      }

      try {
        const raffle = await drawWinners({
          raffleId,
          existingWinners: [...existingWinners],
          ineligible: [userId],
        })

        await bustAllRaffleCacheData()
        await populateRaffleForUser(raffle, user, true)

        return raffle
      } catch (error) {
        throw new GraphQLError(error)
      }
    },
  },
)
