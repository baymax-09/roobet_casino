import { isHouseGameName } from 'src/modules/game/types'

import { type BetHistoryDocument } from '../types'

const MAX_BETS = 11
const MAX_HOUSE_BETS = 6

export const distributeHouseAndTPGames = (bets: BetHistoryDocument[]) => {
  const betsToShow = []

  // Try to get as many house bets as we can
  // TODO rewrite to not use for..in and write some tests
  // eslint-disable-next-line
  for (const betIndex in bets) {
    if (betsToShow.length === MAX_HOUSE_BETS) {
      break
    }
    if (isHouseGameName(bets[betIndex].gameName)) {
      betsToShow.push(bets[betIndex])
      bets.splice(Number(betIndex), 1)
    }
  }
  // Push rest of bets
  betsToShow.push(...bets.slice(0, MAX_BETS - betsToShow.length))

  return betsToShow.sort(
    (a, b) => b.timestamp.valueOf() - a.timestamp.valueOf(),
  )
}
