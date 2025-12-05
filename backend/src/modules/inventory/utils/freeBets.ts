import { type FreeBetBuffSettings } from '../documents/types'
import { InventoryItemDAO } from '../lib'
import { getUserItemByBuffType } from '../documents/items'

export const useFreeBet = async (
  itemId: string | undefined,
  betAmount: number,
  game = '',
) => {
  if (itemId) {
    // Check to see if user has a valid free bet
    const filter = { itemId, buffType: 'FREE_BET' }
    const houseProjection = { buff: 1 }
    const freeBuffItem = await getUserItemByBuffType({
      filter,
      projection: houseProjection,
    })

    if (freeBuffItem) {
      const userBuffSettings = freeBuffItem.buff
        .buffSettings as FreeBetBuffSettings

      if (
        freeBuffItem.buff.type === 'FREE_BET' &&
        userBuffSettings.games &&
        userBuffSettings.games.includes(game)
      ) {
        const userBuffItem = await InventoryItemDAO.useBuff({ itemId })
        if (userBuffItem) {
          betAmount = userBuffSettings.freeBetAmount ?? betAmount
          const freeBetType = userBuffSettings.freeBetType
          return { freeBetType, freeBet: true, newBetAmount: betAmount }
        }
      }
    }
  }
  return { freeBetType: undefined, freeBet: false, newBetAmount: undefined }
}
