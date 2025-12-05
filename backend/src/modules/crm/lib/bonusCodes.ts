import { createVariableFrb } from 'src/vendors/game-providers/pragmatic/lib/api'
import { issueFreespins } from 'src/vendors/game-providers/softswiss/lib/api'
import { issueBonus } from 'src/vendors/game-providers/hacksaw/lib/bonuses'
import { APIValidationError } from 'src/util/errors'
import { crmLogger } from './logger'
import { getBonusCodeByName, type BonusCode } from 'src/modules/crm/documents'
import { getGame } from 'src/modules/tp-games/documents/games'
import { createFreespinCampaign } from 'src/vendors/game-providers/slotegrator/slots/lib/freeSpinsApi'

const handleFreeSpinsType = async (
  bonusCode: BonusCode,
  userId: string,
  reason: string,
  issuerId: string,
) => {
  const { amount, rounds, gameIdentifier, tpGameAggregator } =
    bonusCode.typeSettings

  if (!amount || !rounds || !gameIdentifier) {
    throw new APIValidationError(
      `Invalid bonus code type settings supplied for bonus code: ${bonusCode.name}.`,
    )
  }

  if (tpGameAggregator === 'hacksaw') {
    // Ex: gameIdentifier: hacksaw: 1172. We only need the 1172 portion.
    const gameId = gameIdentifier.split(':')[1]
    await issueBonus({
      userId,
      gameId,
      amount,
      rounds,
      issuerId,
      reason,
    })
    return
  }

  if (tpGameAggregator === 'softswiss') {
    await issueFreespins(
      userId,
      gameIdentifier,
      rounds,
      amount,
      undefined,
      issuerId,
      reason,
    )
    return
  }

  if (tpGameAggregator === 'pragmatic') {
    // Ex: gameIdentifier: pragmatic:vs20fruitswroo. We only need the vs20fruitswroo portion.
    const gameId = gameIdentifier.split(':')[1]
    return await createVariableFrb({
      userId,
      gameId,
      issuerId,
      rounds,
      periodOfTime: 0,
      betPerRound: amount,
      frType: null,
      logTransaction: true,
      reason,
    })
  }

  if (tpGameAggregator === 'slotegrator') {
    const game = await getGame({ identifier: gameIdentifier })
    if (!game) {
      throw new APIValidationError(
        `Game not found for gameIdentifier: ${gameIdentifier}`,
      )
    }
    return await createFreespinCampaign({
      issuerId,
      reason,
      userId,
      campaignName: bonusCode.name,
      game,
      rounds,
      betLevel: amount.toString(),
    })
  }

  throw new APIValidationError(
    `Unable to distribute free spins from aggregator supplied: ${tpGameAggregator}`,
  )
}

const handleBonusCodeDistribution = async (
  bonusCode: BonusCode,
  userId: string,
  reason: string,
  issuerId: string,
) => {
  const { type } = bonusCode

  if (type === 'FREESPINS') {
    return await handleFreeSpinsType(bonusCode, userId, reason, issuerId)
  }

  throw new APIValidationError(`Invalid bonus code type supplied: ${type}`)
}

export const initiateBonusCode = async (
  bonusCode: string,
  userId: string,
  reason: string,
  issuerId: string,
) => {
  // Give the user their free spins
  const bonusCodeDB = await getBonusCodeByName(bonusCode)

  if (!bonusCodeDB) {
    throw new APIValidationError('Cannot find bonus code provided.')
  }

  try {
    return await handleBonusCodeDistribution(
      bonusCodeDB,
      userId,
      reason,
      issuerId,
    )
  } catch (error) {
    crmLogger('initiateBonusCode', { userId }).error(
      `Failed to give ${bonusCode} bonus code to ${userId}. error: ${error.message}`,
      {
        bonusCode,
        reason,
        issuerId,
        bonusCodeDB,
      },
      error,
    )
    throw error
  }
}
