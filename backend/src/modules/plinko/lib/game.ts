import { v4 as uuidv4 } from 'uuid'

import { GameName } from '..'

/*
 * returns a `game` which can be used to place a bet
 * these arent stored in the DB. since 1 game = 1 bet.
 */
export function newPlinkoGame(userId: string) {
  return {
    id: uuidv4(),
    gameName: GameName,
    userId,
  }
}
