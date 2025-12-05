import { objectType } from 'nexus'
import { GraphQLError } from 'graphql'

import { getTicketsForUser } from 'src/modules/raffle/documents/raffleTicket'
import { getFlaggedWithdrawalsCount } from 'src/modules/withdraw/documents/withdrawals_mongo'
import {
  getTronWalletForUser,
  createTronUserWallet,
} from 'src/modules/crypto/tron/lib/wallet'
import { getRippleTagForUser } from 'src/modules/crypto/ripple/lib/wallet'

export const UserType = objectType({
  name: 'User',
  sourceType: {
    module: __dirname,
    export: 'DBUserAdmin',
  },
  definition(type) {
    type.nonNull.uuid('id')
    type.nonNull.string('email')
    type.nonNull.string('name')
    type.nonNull.string('nameLowercase')
    type.string('role', {
      auth: null,
      description:
        'User role, (e.g., HV, VIP [note: separate from authentication roles]).',
    })
    type.nonNull.list.string('roles', {
      auth: null,
      description: 'The list of role slugs assigned to the user.',
      resolve: user => user.roles ?? [],
    })
    type.nonNull.boolean('isStaff', {
      auth: null,
      description: 'The flag signifying if a User is a staff member.',
      // Return false if the property is undefined on the user document.
      resolve: user => user.staff ?? false,
    })
    type.list.field('raffleEntries', {
      type: 'RaffleEntries',
      auth: null,
      resolve: async ({ id: userId }) => await getTicketsForUser(userId),
    })
    type.nonNull.float('lifetimeValue', {
      auth: null,
      description: 'The total lifetime value of the user.',
      resolve: ({
        hiddenTotalDeposited,
        hiddenTotalWithdrawn,
        totalTipped,
        totalTipsReceived,
      }) => {
        const deposited = hiddenTotalDeposited ?? 0
        const withdrawn = hiddenTotalWithdrawn ?? 0
        const tipped = totalTipped ?? 0
        const tipsReceived = totalTipsReceived ?? 0
        return deposited - withdrawn - (tipped - tipsReceived)
      },
    })
    type.nonNull.int('numFlaggedWithdrawals', {
      auth: null,
      description: 'The number of flagged withdrawals belonging to the user.',
      resolve: async ({ id }) => {
        return await getFlaggedWithdrawalsCount({ userId: id })
      },
    })
    type.nonNull.field('rippleDestinationTag', {
      type: 'RippleDestinationTag',
      description:
        'Fetches the current Ripple Network Fee in drop, xrp and usd.',
      auth: {
        authenticated: true,
      },
      resolve: async (sourceType, __, ___, info) => {
        if (info.parentType.name !== 'User') {
          throw new GraphQLError('No user')
        }

        try {
          return await getRippleTagForUser(sourceType.id)
        } catch (error) {
          throw new GraphQLError('unable_destination_tag_ripple')
        }
      },
    })
    type.nonNull.field('tronUserWallet', {
      type: 'TronUserWallet',
      auth: {
        authenticated: true,
      },
      resolve: async (sourceType, __, ___, info) => {
        if (info.parentType.name !== 'User') {
          throw new GraphQLError('No user')
        }

        try {
          const wallet = await getTronWalletForUser(sourceType.id)
          if (wallet) {
            return wallet
          }
          return await createTronUserWallet(sourceType.id)
        } catch (error) {
          throw new GraphQLError('Unable to get tron user wallet')
        }
      },
    })
    type.nonNull.date('createdAt', {
      auth: null,
      description: 'The creation date of the user.',
    })
  },
})
