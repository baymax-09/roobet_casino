import { config } from 'src/system'
import { buildGroup } from 'src/modules/game/lib/shuffle'

import { getPayoutMultiplier } from './payout'
import { type Difficulty, type Card } from '../'
import { Levels, Constants } from '../'
import {
  type ActiveTowersGame,
  type Deck,
} from '../documents/active_towers_games'

const DEFAULT_ROWS = config.towers.defaultRows

export function isValidDifficulty(value: any): value is Difficulty {
  return Object.keys(Levels).includes(value)
}

export function getGameboardLayout(difficulty: Difficulty, amount: number) {
  const payouts = []
  const { columns, poopPerRow } = Levels[difficulty]
  const maxPayout = config.bet.maxProfit
  let maxBet = config.towers.maxBet

  for (let i = 0; i < DEFAULT_ROWS; i++) {
    const multiplier = getPayoutMultiplier(i, poopPerRow, columns)
    const payout = amount * multiplier

    if (payout <= maxPayout) {
      payouts.push(payout)
    }
    // Get the max bet from the max we will payout to the player
    if (i === DEFAULT_ROWS - 1) {
      maxBet = maxPayout / multiplier
    }
  }

  return {
    rows: payouts.length,
    columns,
    payouts,
    poopPerRow,
    maxBet,
  }
}

interface GameboardSettings {
  maxPayout: number
  maxBet: number
  edge: number
  difficulties: typeof Levels
}

export const getGameboardSettings = (): GameboardSettings => {
  const maxPayout = config.bet.maxProfit
  const edge = config.towers.edge
  const maxBet = config.towers.maxBet

  return {
    maxPayout,
    maxBet,
    edge,
    difficulties: Levels,
  }
}

export function setOrderedGroup(poopPerRow: number, shuffledGroup: number[]) {
  const orderedGroup: Card[] = []
  shuffledGroup.forEach((card, index) => {
    orderedGroup[card] = index < poopPerRow ? Constants.poop : Constants.fruit
  })
  return orderedGroup
}

export function createTower(
  difficulty: Difficulty,
  amount: number,
  hash: string,
) {
  const { columns, rows, poopPerRow } = getGameboardLayout(difficulty, amount)

  const deck: Deck = {}
  for (let nonce = 0; nonce < rows; nonce++) {
    const shuffledGroup = buildGroup(columns, `${hash}-${nonce}`)
    const orderedGroup = setOrderedGroup(poopPerRow, shuffledGroup)
    deck[nonce] = {}
    for (let column = 0; column < columns; column++) {
      deck[nonce][column] = orderedGroup[column]
    }
  }

  return { deck, poopPerRow, columns, rows }
}

export function getCurrentRow(activeGame: ActiveTowersGame): number {
  // @ts-expect-error TODO number vs string for Towers deck indexing
  const currentRow = Math.max(-1, ...Object.keys(activeGame.played)) + 1
  return currentRow
}
