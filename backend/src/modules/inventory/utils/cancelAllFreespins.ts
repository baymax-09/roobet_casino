import { cancelFrb } from 'src/vendors/game-providers/pragmatic/lib/api'
import { type ErrorFreeSpins } from 'src/modules/inventory/documents/types'
import { cancelFreespins } from 'src/vendors/game-providers/softswiss/lib/api'
import { revokeBonus } from 'src/vendors/game-providers/hacksaw/lib/bonuses'

export const cancelAllFreespins = async (
  errorsFreeSpins: ErrorFreeSpins,
  userId: string,
) => {
  // Cancel the free spins if they were already given out to the user
  const cancelFreeSpinPromises: Array<Promise<any>> = []
  if (errorsFreeSpins.pragmaticBonusCodes.length) {
    errorsFreeSpins.pragmaticBonusCodes.forEach(async bonusCode => {
      cancelFreeSpinPromises.push(cancelFrb(bonusCode))
    })
  }
  if (errorsFreeSpins.softswissIssueIds.length) {
    errorsFreeSpins.softswissIssueIds.forEach(async issueId => {
      cancelFreeSpinPromises.push(cancelFreespins(issueId))
    })
  }
  if (errorsFreeSpins.hacksawExternalOfferIds.length) {
    errorsFreeSpins.hacksawExternalOfferIds.forEach(async externalOfferId => {
      cancelFreeSpinPromises.push(revokeBonus({ userId, externalOfferId }))
    })
  }
  return await Promise.all(cancelFreeSpinPromises)
}
