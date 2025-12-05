import { objectType } from 'nexus'

export const BetActivityType = objectType({
  name: 'BetActivityType',
  description: 'Bet Activity Data',
  definition(type) {
    type.string('title')
    type.string('gameName')
    type.string('identifier')
    type.int('wagers')
    type.float('wagered')
    type.float('avgWager')
    type.float('payout')
    type.float('ggr')
  },
})
