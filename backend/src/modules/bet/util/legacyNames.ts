import {
  isLegacyHouseGameIdentifier,
  isNewHouseGameName,
  isTPHouseGameName,
  isHouseGameName,
  type HouseGameName,
} from 'src/modules/game/types'

const HouseGameNameToGameIdentifier: Record<HouseGameName, string> = {
  hotbox: 'housegames:hotbox',
  plinko: 'housegames:Plinko',
  cashdash: 'luckypengwin:yetiCashDash',
  coinflip: 'housegames:coinflip',
  junglemines: 'housegames:junglemines',
  dice: 'housegames:dice',
  roulette: 'housegames:roulette',
  towers: 'housegames:towers',
  crash: 'housegames:crash',
  mines: 'housegames:mines',
  linearmines: 'housegames:linearmines',
  blackjack: 'housegames:blackjack',

  // Currently not used.
  hilo: 'housegames:hilo',
}

export const convertTPHouseGameNameToGameIdentifier = (gameName: string) => {
  if (!isTPHouseGameName(gameName)) {
    return gameName
  }

  return HouseGameNameToGameIdentifier[gameName]
}

export const convertNewHouseGameNameToGameIdentifier = (gameName: string) => {
  if (!isNewHouseGameName(gameName)) {
    return gameName
  }
  return HouseGameNameToGameIdentifier[gameName]
}

export const convertHouseGameNameToGameIdentifier = (gameName: string) => {
  if (!isHouseGameName(gameName)) {
    return gameName
  }

  return HouseGameNameToGameIdentifier[gameName]
}

export const convertLegacyGameIdentifierToLegacyGameName = (
  gameIdentifier: string,
) => {
  if (!isLegacyHouseGameIdentifier(gameIdentifier)) {
    return gameIdentifier
  }

  const gameName = Object.keys(HouseGameNameToGameIdentifier).find(key => {
    return (
      HouseGameNameToGameIdentifier[key as HouseGameName] === gameIdentifier
    )
  })

  return gameName ?? gameIdentifier
}
