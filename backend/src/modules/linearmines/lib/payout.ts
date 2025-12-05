import { config } from 'src/system'
import { type ActiveLinearMinesGame } from '../documents/active_linear_mines_games'

export function getDiamondCount(activeGame: ActiveLinearMinesGame) {
  const diamonds = Object.values(activeGame.played || {}).filter(
    card => card == 'diamond',
  ).length
  return diamonds
}

export function getPlayedMinesCount(activeGame: ActiveLinearMinesGame): number {
  const mines = Object.values(activeGame.played || {}).filter(
    card => card === 'mine',
  ).length
  return mines
}

export function getMinesInDeckCount(activeGame: ActiveLinearMinesGame) {
  const mines = Object.values(activeGame.deck || {}).filter(
    card => card === 'mine',
  ).length
  return mines
}

export function getPayoutMultiplier(activeGame: ActiveLinearMinesGame) {
  const diamonds = getDiamondCount(activeGame)
  const mines = getMinesInDeckCount(activeGame)
  if (diamonds == 0) {
    return 0
  }

  const houseEdge = config.linearmines.edge / 100
  const payout =
    ((1 - houseEdge) * factorial(25, diamonds)) /
    factorial(25 - mines, diamonds)
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
