import { objectType, list, nonNull, enumType } from 'nexus'

import { getTotalTicketsForRaffleById } from 'src/modules/raffle/documents/raffleTicket'
import { RaffleModifierTypes } from 'src/modules/raffle/lib/types'

const RaffleTypeEnumType = enumType({
  name: 'RaffleTypeEnumType',
  members: ['default', 'advent'],
})

const RaffleModifierIdentifierType = objectType({
  name: 'RaffleModifierIdentifier',
  definition(type) {
    type.string('id')
    type.string('title')
  },
})

const RaffleModiferEnumType = enumType({
  name: 'RaffleModifierEnumType',
  members: RaffleModifierTypes,
  description: 'Allowed modifier types for our Raffles',
})

const RaffleModifierType = objectType({
  name: 'RaffleModifier',
  definition(type) {
    type.field('identifiers', {
      auth: null,
      type: list(nonNull(RaffleModifierIdentifierType)),
    })
    type.float('ticketsPerDollar')
    type.field('type', {
      auth: null,
      type: nonNull(RaffleModiferEnumType),
    })
  },
})

export const RaffleType = objectType({
  name: 'Raffle',
  sourceType: {
    module: __dirname,
    export: 'DBRaffle',
  },
  definition(type) {
    type.id('id', {
      auth: null,
      resolve: ({ _id }) => _id.toString(),
    })
    type.int('amount')
    type.boolean('archived')
    type.string('bannerImage')
    type.date('end')
    type.string('featureImage')
    type.field('modifiers', {
      auth: null,
      type: list(nonNull(RaffleModifierType)),
    })
    type.string('name')
    type.list.string('payouts')
    type.string('slug')
    type.date('start')
    type.float('ticketsPerDollar')
    type.int('totalTickets', {
      auth: null,
      resolve: async ({ _id }) => await getTotalTicketsForRaffleById(_id),
    })
    type.field('type', {
      auth: null,
      type: RaffleTypeEnumType,
    })
    type.int('winnerCount')
    type.list.string('winners')
    type.boolean('winnersRevealed')
  },
})
