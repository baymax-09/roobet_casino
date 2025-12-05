import { config } from 'src/system'
import { type ActiveMinesGame } from '../documents/active_mines_games'

export function getDiamondCount(activeGame: Omit<ActiveMinesGame, 'id'>) {
  const diamonds = Object.values(activeGame.played || {}).filter(
    card => card == 'diamond',
  ).length
  return diamonds
}

export function getPlayedMinesCount(activeGame: ActiveMinesGame): number {
  const minesCount = Object.values(activeGame.played || {}).filter(
    card => card == 'mine',
  ).length
  return minesCount
}

export function getMinesInDeckCount(activeGame: Omit<ActiveMinesGame, 'id'>) {
  const mines = Object.values(activeGame.deck || {}).filter(
    card => card == 'mine',
  ).length
  return mines
}

export function getPayoutMultiplier(activeGame: Omit<ActiveMinesGame, 'id'>) {
  const diamonds = getDiamondCount(activeGame)
  const mines = getMinesInDeckCount(activeGame)
  const tiles = activeGame.gridCount ?? 25
  if (diamonds == 0) {
    return 0
  }

  const houseEdge = config.mines.edge / 100
  const payout =
    ((1 - houseEdge) * factorial(tiles, diamonds)) /
    factorial(tiles - mines, diamonds)
  return parseFloat(payout.toFixed(2))
}

function factorial(n: number, r: number) {
  const mines = factorialize(n)
  const diamonds = factorialize(r)
  const difference = factorialize(n - r)

  return mines / diamonds / difference
}

function factorialize(num: number): number {
  if (num < 0) {
    return -1
  } else if (num == 0) {
    return 1
  } else {
    return num * factorialize(num - 1)
  }
}
