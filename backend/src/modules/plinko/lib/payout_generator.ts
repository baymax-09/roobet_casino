import { calculatePayoutAverage, getHolesProbabilities } from './board'
import {
  LIGHTNING_BOARD_ROW_NUMBERS,
  type PathCell,
  calculateExtraMultiplierFromPath,
  getHoleFromBallPath,
  type SpecialCell,
} from './lightning_board'
import { getPayoutAdjustmentsForCell } from './lightning_board'
import { buildGroup } from 'src/modules/game/lib/shuffle'
import { type LightningBoard } from './fetch_current_payouts'
import { printPayoutArray } from './analysis'
import { plinkoLogger } from './logger'

const MULTIPLIER_PEG_VALUES = [
  2, 5, 5, 7, 7, 8, 8, 9, 9, 10, 10, 12, 12, 20, 25, 30, 35, 40, 50,
]
const minimumMultiplierPegs = 3
const maximumMultiplierPegsExclusive = 3
const MIN_ROW_FOR_MULTIPLIER_CELLS_TOP = 4
const MIN_ROW_FOR_MULTIPLIER_CELLS_MID = 8
const MIN_ROW_FOR_MULTIPLIER_CELLS_BOTTOM = 12

const MAX_HOLE_PAYOUT = 1000

export function generateGuaranteedPayouts(
  numberOfRows: number,
  edge: number,
): number[] {
  const one_minus_edge = 1 - edge / 100
  const probabilities = getHolesProbabilities(numberOfRows)
  const guaranteedPayouts = probabilities.map(_probability => one_minus_edge)
  return guaranteedPayouts
}

export function generateBasePayoutsIterative(
  previousPayouts: number[],
  lastGoodPayouts: number[],
  lastBadPayouts: number[],
  iterateDown: boolean,
  probabilities: number[],
): number[] {
  let payouts = previousPayouts
  if (iterateDown) {
    // get halfway point between guaranteed and desired
    const halfwayPayouts = previousPayouts.map((previousPayout, index) => {
      const goodPayout = lastGoodPayouts[index]
      return (previousPayout + goodPayout) / 2
    })

    // excluded holes inlcudes ids of every hole ecxcept first and last
    const excludedHoles = []
    for (let i = 1; i < halfwayPayouts.length - 1; i++) {
      excludedHoles.push(i)
    }

    // iteratively call redistributePayoutsWithConstraints
    // only every element except first and last in array
    for (let i = 1; i < halfwayPayouts.length - 1; i++) {
      // round to 4 decimals first
      const unrounded = halfwayPayouts[i]
      const roundedHalfwayPayoutFloating = Math.round(unrounded * 10000) / 10000
      const roundedHalfwayPayout =
        Math.floor(roundedHalfwayPayoutFloating * 1000) / 1000
      payouts = redistributePayoutsWithConstraints(
        payouts,
        i,
        roundedHalfwayPayout,
        probabilities,
        excludedHoles,
      )
    }
  } else {
    const halfwayPayouts = previousPayouts.map((previousPayout, index) => {
      const idealPayout = lastBadPayouts[index]
      return (previousPayout + idealPayout) / 2
    })

    // excluded holes inlcudes ids of every hole ecxcept first and last
    const excludedHoles = []
    for (let i = 1; i < halfwayPayouts.length - 1; i++) {
      excludedHoles.push(i)
    }

    // iteratively call redistributePayoutsWithConstraints
    // only every element except first and last in array
    for (let i = 1; i < halfwayPayouts.length - 1; i++) {
      const unrounded = halfwayPayouts[i]
      const roundedHalfwayPayoutFloating = Math.round(unrounded * 10000) / 10000
      const roundedHalfwayPayout =
        Math.floor(roundedHalfwayPayoutFloating * 1000) / 1000
      payouts = redistributePayoutsWithConstraints(
        payouts,
        i,
        roundedHalfwayPayout,
        probabilities,
        excludedHoles,
      )
    }
  }

  return payouts
}

/**
 * @param numberOfRows Integer number between 8 and 16.
 * @param edge Edge float number between 0 and 100.
 */
export function generateBasePayouts(
  numberOfRows: number,
  edge: number,
): number[] {
  // const probabilities = getHolesProbabilities(numberOfRows)
  const payouts = [
    1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000,
  ] // Start with the payouts for the High risk mode
  const one_minus_edge = 1 - edge / 100
  const high_edge = 1
  const one_minus_edge_old = 1 - high_edge / 100
  const edge_adjustment_multiplier = one_minus_edge_old / one_minus_edge

  const holeNumber = payouts.length
  for (let i = 0; i < holeNumber; i++) {
    const payout = payouts[i] / edge_adjustment_multiplier
    payouts[i] = payout
  }

  return payouts
}

export function generateLightningPayouts(
  hash: string,
  edge: number,
  pathCells: PathCell[][],
  numberOfRows: number,
  multiplierCellsExtra = [],
): LightningBoard {
  return generateLightningPayoutsRecursive(
    hash,
    edge,
    pathCells,
    numberOfRows,
    multiplierCellsExtra,
    0,
  )
}

export function generateLightningPayoutsRecursive(
  original_hash: string,
  edge: number,
  pathCells: PathCell[][],
  numberOfRows: number,
  multiplierCellsExtra = [],
  counter: number,
): LightningBoard {
  const hash = counter > 0 ? String(counter) + original_hash : original_hash

  const basePayouts: number[] = generateBasePayouts(numberOfRows, edge)
  if (counter > 10) {
    return {
      payouts: basePayouts,
      multiplierCells: [],
    }
  }
  const probabilities: number[] = getHolesProbabilities(numberOfRows)
  const shuffledGroup: number[] = buildGroup(100, hash) // This returns 100 numbers between 0 and 100
  const shuffledNormalized = shuffledGroup.map(x => x / 100)
  let usageCounter = 0

  let holes_to_zero_payout: number[] = []
  const numberOfHolesWithZeroPayout =
    2 + Math.floor(getNextRandomNumber(shuffledNormalized, usageCounter++) * 2)

  for (let i = 0; i < numberOfHolesWithZeroPayout; i++) {
    let hole =
      6 +
      Math.floor(getNextRandomNumber(shuffledNormalized, usageCounter++) * 5)
    if (hole >= 10) {
      // Not sure if array containes exact 1's
      hole = 10
    }
    if (!holes_to_zero_payout.includes(hole)) {
      holes_to_zero_payout.push(hole)
    } else {
      i--
    }
  }

  // TODO Why the loop above just to reassign here?
  holes_to_zero_payout = [6, 8, 10]

  const payoutsAfterZeroingHoles = redistributePayoutsMindingZerosArray(
    basePayouts,
    probabilities,
    holes_to_zero_payout,
  )

  const randNumber = getNextRandomNumber(shuffledNormalized, usageCounter++)
  const multiplierCells: SpecialCell[] = [...multiplierCellsExtra]
  let numberOfMultiplierPegs =
    minimumMultiplierPegs +
    Math.floor(
      randNumber * (maximumMultiplierPegsExclusive - minimumMultiplierPegs),
    ) // NOTE This never hits the maximumMultiplierPegsExclusive because the biggest randNumber is 0.99

  if (multiplierCellsExtra.length > 0) {
    numberOfMultiplierPegs = 0
  }

  const startOfSlice = usageCounter
  const endOfSlice = startOfSlice + MULTIPLIER_PEG_VALUES.length
  usageCounter = endOfSlice
  const sliceOfShuffledNormalized = shuffledNormalized.slice(
    startOfSlice,
    endOfSlice,
  )

  let multiplierPegValues = [...MULTIPLIER_PEG_VALUES]
  multiplierPegValues = shuffleArray(
    multiplierPegValues,
    sliceOfShuffledNormalized,
  )

  for (let i = 0; i < numberOfMultiplierPegs; i++) {
    const multiplier = multiplierPegValues[i]
    const minRow = MIN_ROW_FOR_MULTIPLIER_CELLS_TOP
    const range = 11
    // if (multiplier <= 4) {
    //   minRow = MIN_ROW_FOR_MULTIPLIER_CELLS_TOP
    //   range = 4
    // } else if (multiplier <= 8) {
    //   minRow = MIN_ROW_FOR_MULTIPLIER_CELLS_MID
    //   range = 4
    // } else {
    //   minRow = MIN_ROW_FOR_MULTIPLIER_CELLS_BOTTOM
    //   range = 3
    // }

    const row =
      minRow +
      Math.floor(
        getNextRandomNumber(shuffledNormalized, usageCounter++) * range,
      )
    let column = 0
    // if (multiplier > 8) {
    //   const a_or_b = getNextRandomNumber(shuffledNormalized, usageCounter++)
    //   const offset = Math.floor(getNextRandomNumber(shuffledNormalized, usageCounter++) * (3))
    //   if (a_or_b < 0.5) {
    //     column = offset
    //   } else {
    //     column = row - offset
    //   }
    // } else {
    //   column = Math.floor(getNextRandomNumber(shuffledNormalized, usageCounter++) * (row + 1))
    // }
    column =
      1 +
      Math.floor(
        getNextRandomNumber(shuffledNormalized, usageCounter++) * (row - 1),
      ) // 1 to row-1 since we want to skip the first and last columns, otherwise it would be 0 to row +1

    // check if cell is too close to others, if so, negate its column
    const cell = { row, column }
    const isTooClose = multiplierCells.some(multiplierCell => {
      const distance =
        Math.abs(multiplierCell.row - cell.row) +
        Math.abs(multiplierCell.column - cell.column)
      return distance < 4
    })
    if (isTooClose) {
      // cell.column = (cell.column + (LIGHTNING_BOARD_ROW_NUMBERS/2)) % LIGHTNING_BOARD_ROW_NUMBERS
      // try again
      i--
    } else {
      multiplierCells.push({
        row,
        column,
        multiplier,
      })
    }
  }

  const constrainedPayouts = redistributePayoutsToFitContraints(
    payoutsAfterZeroingHoles,
    probabilities,
  )
  const payoutAdjustments = getAllAdjustmentsNeededForCells(
    pathCells,
    numberOfRows,
    multiplierCells,
    probabilities,
    constrainedPayouts,
  )
  const payoutsIncludingBonusPegs =
    redistributePayoutsMindingMultiplierPegsArray(
      constrainedPayouts,
      payoutAdjustments,
    )

  const payoutsRoundedDecimals = redistributePayoutsToTwoDecimals(
    payoutsIncludingBonusPegs,
    probabilities,
    payoutAdjustments,
    multiplierCells,
    pathCells,
  )
  if (!payoutsRoundedDecimals.accepted) {
    return generateLightningPayoutsRecursive(
      original_hash,
      edge,
      pathCells,
      numberOfRows,
      multiplierCellsExtra,
      counter + 1,
    )
  }
  return { payouts: payoutsRoundedDecimals.new_payouts, multiplierCells }
}

export function getNextRandomNumber(
  shuffledNumbers: number[],
  counter: number,
) {
  let _counter = counter
  if (_counter >= shuffledNumbers.length) {
    _counter = _counter % shuffledNumbers.length
  }
  return shuffledNumbers[_counter]
}

export function redistributePayoutsToTwoDecimals(
  payouts: number[],
  probabilities: number[],
  payoutAdjustments: number[],
  multiplierCells: SpecialCell[],
  pathCells: PathCell[][],
) {
  const new_probablities = []
  for (let i = 0; i < probabilities.length; i++) {
    new_probablities.push(probabilities[i] * payoutAdjustments[i])
  }

  const edge: number =
    parseFloat(process.env.PLINKO_LIGHTNING_HOUSE_EDGE || '') || 4.0
  const numberOfRows = LIGHTNING_BOARD_ROW_NUMBERS

  // Convert every number to its rounded form
  // redistribute its payout and add it to exclusion list
  // at the end of the array if remainder is > 0.01 distribute it over the one with lowest (adjusted) probablity

  let accepted = false
  let iteration = 0
  let new_payouts = [...payouts]
  new_payouts = calculateRoundedPayouts(
    new_payouts,
    new_probablities,
    payoutAdjustments,
    probabilities,
  )
  const { result, message, payoutAverage } = verifyAveragePayoutWithMultipliers(
    numberOfRows,
    new_payouts,
    probabilities,
    edge,
    multiplierCells,
    pathCells,
  )
  accepted = result
  iteration++

  return { new_payouts, accepted }
}

function calculateRoundedPayouts(
  old_payouts: number[],
  new_probablities: number[],
  payoutAdjustments: number[],
  probabilities: number[],
) {
  const rowNumbers = LIGHTNING_BOARD_ROW_NUMBERS
  const finalIndex = old_payouts.length
  let excluded_indexes: number[] = []
  let new_payouts = [...old_payouts]
  let indexes_excluded = rowNumbers
  let iterations = 0

  while (indexes_excluded > 0) {
    iterations++

    indexes_excluded = 0
    for (let i = 0; i < rowNumbers; i++) {
      if (!excluded_indexes.includes(i)) {
        // Number has not been rounded
        indexes_excluded += 1
      }
    }
    if (iterations > 1000) {
      plinkoLogger('calculateRoundedPayouts', { userId: null }).warn(
        `Reached iterations > 1000 with ${new_payouts} and r emaining unrounded numbers ${excluded_indexes}`,
        { new_payouts, excluded_indexes },
      )
      return new_payouts
    }

    excluded_indexes = []

    for (let i = 0; i < new_payouts.length; i++) {
      const some_payout = new_payouts[i]
      if (some_payout >= MAX_HOLE_PAYOUT) {
        excluded_indexes.push(i)
      }
      if (some_payout <= 0.01) {
        excluded_indexes.push(i)
      }

      const rounded_payout = Math.floor(some_payout * 100) / 100
      const tmp_remainder = some_payout - rounded_payout
      if (tmp_remainder <= 0) {
        excluded_indexes.push(i)
      }
    }
    // cleanup duplicates from excluded_indexes
    excluded_indexes = [...new Set(excluded_indexes)]

    for (let index = 0; index < new_payouts.length; index++) {
      const value = new_payouts[index]
      const rounded_payout = Math.round(value * 100) / 100 // round to closest 0.01
      const remainder = value - rounded_payout
      if (!excluded_indexes.includes(index)) {
        if (index === finalIndex - 1) {
          new_payouts[index] = rounded_payout
          const payoutDelta =
            value * new_probablities[index] -
            rounded_payout * new_probablities[index]
          const last_payout =
            new_payouts[index] + payoutDelta / new_probablities[index]
          new_payouts[index] = Math.round(last_payout * 100) / 100
          excluded_indexes.push(index)
        } else {
          new_payouts = redistributePayoutsWithConstraints(
            new_payouts,
            index,
            rounded_payout,
            new_probablities,
            excluded_indexes,
          )
          excluded_indexes.push(index)
        }
      }
    }
  }

  return new_payouts
}

function getHoleWithLowestImpactIfRounded(
  adjustments: number[],
  probabilities: number[],
): number {
  let minIndex = -1
  let minAdjustment = 9999999999
  for (let i = 0; i < adjustments.length; i++) {
    if (adjustments[i] < minAdjustment) {
      minIndex = i
      minAdjustment = adjustments[i]
    } else if (adjustments[i] == minAdjustment) {
      if (probabilities[i] < probabilities[minIndex]) {
        minIndex = i
      }
    }
  }
  return minIndex
}

export function verifyAveragePayoutWithMultipliers(
  numberOfRows: number,
  payouts: number[],
  probabilities: number[],
  edge: number,
  multiplierCells: SpecialCell[],
  pathCells: PathCell[][],
): { result: boolean; message: string; payoutAverage: number } {
  const payoutsFinal = [...payouts]

  // const payoutAdjustments = getAllAdjustmentsNeededForCells(pathCells, numberOfRows, multiplierCells, probabilities)
  const payoutAdjustments = getAllAdjustmentsNeededForCells(
    pathCells,
    numberOfRows,
    multiplierCells,
    probabilities,
    payouts,
  )

  for (let i = 0; i < payoutAdjustments.length; i++) {
    const adjustment = payoutAdjustments[i]
    if (adjustment < 0 || isNaN(adjustment) || !isFinite(adjustment)) {
      const error = `Error: payoutAdjustment for hole ${i} is ${adjustment}`
      return { payoutAverage: 0, result: false, message: error }
    }
  }
  for (let hole = 0; hole < payoutAdjustments.length; hole++) {
    const adjustment = payoutAdjustments[hole]
    const newPayout = payouts[hole] * adjustment
    payoutsFinal[hole] = newPayout
  }

  const payoutAverage = calculatePayoutAverage(payoutsFinal, probabilities)
  const expectedPayoutAverage = 1 - edge / 100
  const error = Math.abs(payoutAverage - expectedPayoutAverage)
  if (error > 0.005) {
    // Error margin is 0.5%
    const error = `Expected payout average ${expectedPayoutAverage} but got ${payoutAverage.toFixed(
      4,
    )} for payout array ${printPayoutArray(payoutsFinal)}`
    return { payoutAverage, result: false, message: error }
  } else {
    const message = `Payout average: ${payoutAverage} for payout array ${payouts} with length ${payouts.length}`
    return { payoutAverage, result: true, message }
  }
}

export function redistributePayoutsToFitContraints(
  payouts: number[],
  probabilities: number[],
): number[] {
  let newPayouts = [...payouts]

  // Limit payout to 500
  const excludedMaxedHoles: number[] = []
  for (let i = 0; i < payouts.length; i++) {
    if (newPayouts[i] > MAX_HOLE_PAYOUT) {
      const hole = i
      const changedPayout = MAX_HOLE_PAYOUT

      newPayouts = redistributePayoutsMindingZeros(
        newPayouts,
        hole,
        changedPayout,
        probabilities,
        excludedMaxedHoles,
      )
      excludedMaxedHoles.push(hole)
    }
  }

  return newPayouts
}

export function redistributePayoutsMindingMultiplierPegsArray(
  payouts: number[],
  payoutAdjustments: number[],
): number[] {
  const newPayouts = [...payouts]

  for (let hole = 0; hole < payoutAdjustments.length; hole++) {
    const adjustment = payoutAdjustments[hole]
    const newPayout = payouts[hole] / adjustment
    newPayouts[hole] = newPayout
  }

  return newPayouts
}

export function getAllAdjustmentsNeededForCells(
  pathCells: PathCell[][],
  numberOfRows: number,
  multiplierCells: SpecialCell[],
  holeProbabilities: number[],
  payouts: number[],
): number[] {
  const withoutBonus: number[] = []
  const adjustments: number[] = []
  const numberOfHoles = numberOfRows + 1
  for (let i = 0; i < numberOfHoles; i++) {
    adjustments.push(0)
    withoutBonus.push(0)
  }
  for (let i = 0; i < pathCells.length; i++) {
    const path = pathCells[i]
    const hole = getHoleFromBallPath(path)
    const totalMultiplier = calculateExtraMultiplierFromPath(
      multiplierCells,
      path,
    )
    const result = (totalMultiplier > 0 ? totalMultiplier : 1) * payouts[hole]
    adjustments[hole] += result
    withoutBonus[hole] += payouts[hole]
  }

  const resultAdjustments: number[] = adjustments.map((adjustment, index) => {
    if (withoutBonus[index] == 0) {
      return 1
    }
    return adjustment / withoutBonus[index]
  })

  return resultAdjustments
}

export function redistributePayoutsMindingMultiplierPegs(
  payouts: number[],
  cell: SpecialCell,
  probabilities: number[],
  _excludeHoles?: number[],
): number[] {
  const numberOfRows = payouts.length - 1

  const excludeHoles = _excludeHoles === undefined ? [] : _excludeHoles
  const holesWithZeroPlusExcluded = [...excludeHoles]
  for (let i = 0; i <= payouts.length; i++) {
    if (payouts[i] <= 0) {
      holesWithZeroPlusExcluded.push(i)
    }
  }

  const payoutAdjustments = getPayoutAdjustmentsForCell(numberOfRows, cell)

  const newPayouts: number[] = [...payouts]
  for (let i = 0; i < payoutAdjustments.length; i++) {
    const adjustment = payoutAdjustments[i]
    const hole = i
    if (adjustment > 0) {
      const newPayout = payouts[hole] / adjustment
      newPayouts[hole] = newPayout
    }
  }

  return newPayouts
}

export function redistributePayoutsMindingZerosArray(
  payouts: number[],
  probabilities: number[],
  holes_to_zero_payout: number[],
): number[] {
  let newPayouts = [...payouts]

  for (let i = 0; i < holes_to_zero_payout.length; i++) {
    const hole = holes_to_zero_payout[i]

    newPayouts = redistributePayoutsMindingZeros(
      newPayouts,
      hole,
      0,
      probabilities,
    )
  }
  return newPayouts
}

export function redistributePayoutsMindingZeros(
  payouts: number[],
  modifiedHole: number,
  newPayout: number,
  _probabilities: number[],
  _excludeHoles?: number[],
): number[] {
  const excludeHoles = _excludeHoles === undefined ? [] : _excludeHoles
  const holesWithZeroPlusExcluded = [...excludeHoles]
  for (let i = 0; i <= payouts.length; i++) {
    if (payouts[i] <= 0) {
      holesWithZeroPlusExcluded.push(i)
    }
  }

  const newPayouts = redistributePayoutsWithConstraints(
    payouts,
    modifiedHole,
    newPayout,
    _probabilities,
    holesWithZeroPlusExcluded,
  )
  return newPayouts
}

export function redistributePayoutsWithConstraints(
  payouts: number[],
  modifiedHole: number,
  newPayout: number,
  probabilities: number[],
  _excludeHoles: number[],
): number[] {
  const excludeHoles: number[] = []
  _excludeHoles.forEach(holeIndex => {
    if (!excludeHoles.includes(holeIndex)) {
      excludeHoles.push(holeIndex)
    }
  })

  const currentNumberOfExcluded = excludeHoles.length
  if (currentNumberOfExcluded >= payouts.length) {
    plinkoLogger('redistributePayoutsWithConstraints', { userId: null }).error(
      'Should not exclude all holes when redistributing payouts',
    )
  }

  const equalShareWeight = 1 / (payouts.length - currentNumberOfExcluded - 1)
  const shareWeights = Array(payouts.length).fill(equalShareWeight)
  for (let i = 0; i <= payouts.length; i++) {
    if (excludeHoles.includes(i)) {
      shareWeights[i] = 0
    }
  }

  const newPayouts = redistributePayouts(
    payouts,
    modifiedHole,
    newPayout,
    probabilities,
    shareWeights,
  )

  return newPayouts
}

export function redistributePayouts(
  payouts: number[],
  modifiedHole: number,
  newPayout: number,
  probabilities: number[],
  shareWeights: number[],
): number[] {
  const newPayouts = [...payouts]
  const payoutDelta =
    payouts[modifiedHole] * probabilities[modifiedHole] -
    newPayout * probabilities[modifiedHole]

  for (let i = 0; i < newPayouts.length; i++) {
    if (i === modifiedHole) {
      newPayouts[i] = newPayout
    } else {
      const shareWeight = shareWeights[i]
      newPayouts[i] += (payoutDelta * shareWeight) / probabilities[i]
    }
  }

  return newPayouts
}

export function shuffleArray(
  originalArray: number[],
  randomNumbers: number[],
): number[] {
  const shuffledNumbers = [...originalArray]

  let randIndex = 0
  for (let i = originalArray.length - 1; i > 0; i--) {
    const j = Math.floor(randomNumbers[randIndex] * (i + 1))

    const tmp = shuffledNumbers[j]
    shuffledNumbers[j] = shuffledNumbers[i]
    shuffledNumbers[i] = tmp
    randIndex += 1
  }
  return shuffledNumbers
}
