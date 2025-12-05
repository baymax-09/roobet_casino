import { type TPGame } from 'src/modules/tp-games'
import { type BetHistoryDocument } from '../types'
import { isLegacyHouseGameName } from 'src/modules/game/types'
import { convertTPHouseGameNameToGameIdentifier } from '../util'
import { exists } from 'src/util/helpers/types'
import { getGameSquareImages } from 'src/modules/tp-games/documents/games'

type BetHistoryWithGameData = BetHistoryDocument & {
  game: Pick<TPGame, 'squareImage'>
}

const parseBetGameIdentifier = (identifier?: string): string | undefined => {
  if (!identifier) {
    return undefined
  }

  if (isLegacyHouseGameName(identifier)) {
    return convertTPHouseGameNameToGameIdentifier(identifier)
  }

  return identifier
}

const reduceGameIdentifiers = (bets: BetHistoryDocument[]): string[] => {
  const identifiers = bets.map(bet => {
    return parseBetGameIdentifier(bet.gameIdentifier)
  })

  return [...new Set(identifiers.filter(exists))]
}

export const populateGameDataOnBets = async (
  bets: BetHistoryDocument[],
): Promise<BetHistoryWithGameData[]> => {
  const identifiers = reduceGameIdentifiers(bets)
  const images = await getGameSquareImages(identifiers)

  return bets.map(bet => {
    const identifier = parseBetGameIdentifier(bet.gameIdentifier)

    return {
      ...bet,
      game: {
        squareImage: identifier ? images[identifier] : undefined,
      },
    }
  })
}
