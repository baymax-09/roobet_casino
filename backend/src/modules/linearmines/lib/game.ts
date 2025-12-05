import { v4 as uuidv4 } from 'uuid'

import { GameName } from '..'

interface NewLinearMinesGame {
  id: string
  gameName: typeof GameName
}

export function newLinearMinesGame(): NewLinearMinesGame {
  return {
    id: uuidv4(),
    gameName: GameName,
  }
}
