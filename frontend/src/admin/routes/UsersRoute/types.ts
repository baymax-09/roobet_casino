import {
  type User,
  type SportsbookBonus,
  type SportsbookBonusTemplate,
} from 'common/types'

export type UserData = Record<string, any> & {
  user: User
  slotegratorBonuses?: Array<
    SportsbookBonus & { template?: SportsbookBonusTemplate }
  >
  slotegratorSlotsFreespins?: Array<{
    _id: string
    campaignName: string
    userId: string
    gameId: string
    rounds: number
    roundsRemaining: number
    betLevel: string
    expiry: string
  }>
  softswissFreespins?: Array<{
    _id: string
    bet_level: number
    freespins_quantity: number
    games: string[]
    userId: string
    valid_until: string
    createdAt: string
    updatedAt: string
  }>
  pragmaticFreespins: {
    error: string
    description: string
    bonuses: Array<{
      currency: string
      gameIDList: string
      rounds: number
      roundsPlayed: number
      bonusCode: string
      expirationDate: string
      bonusId: number
      createDate: string
      packageId: number
    }>
  }
  hacksawFreespins: Array<{
    gameId: number
    currencyCode: string
    betLevel: number
    nbRounds: number
    externalOfferId: string
    createDate: string
    expiryDate: string
    channel: number
    buyBonus: null
  }>
}
