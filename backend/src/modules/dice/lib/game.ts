import { v1 as uuidv1 } from 'uuid'

import { GameName } from '../'

/*
 * returns a `game` which can be used to place a bet
 * these arent stored in the DB. since 1 game = 1 bet.
 */
export function newDiceGame() {
  return {
    id: uuidv1(),
    gameName: GameName,
  }
}
