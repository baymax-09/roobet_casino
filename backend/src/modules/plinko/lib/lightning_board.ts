import { getHolesProbabilities } from './board'

export interface PathCell {
  row: number
  column: number
}

export interface SpecialCell {
  row: number
  column: number
  multiplier: number
}

export function existsInMultiplierArray(
  multiplierCells: SpecialCell[],
  row: number,
  column: number,
): boolean {
  return multiplierCells.some(
    cell => cell.row === row && cell.column === column,
  )
}

// This number will never change
export const LIGHTNING_BOARD_ROW_NUMBERS = 16

export function getPegMultiplier(
  multiplierCells: SpecialCell[],
  c_row: number,
  c_col: number,
) {
  return (
    multiplierCells.find(cell => cell.row === c_row && cell.column === c_col)
      ?.multiplier ?? 0
  )
}

export function calculateBallPath(
  randNumber: number[],
  numRows: number,
): PathCell[] {
  if (randNumber.length < numRows) {
    throw new Error(`randNumber array length must at least equal to ${numRows}`)
  }

  const path: PathCell[] = []
  let prev_col = 0
  for (let i = 0; i < numRows; i++) {
    const row = i + 1
    const is_left = !!randNumber[i]
    const column = is_left ? prev_col : prev_col + 1
    path.push({
      row,
      column,
    })
    prev_col = column
  }

  return path
}

export function generateEveryPossiblePath(numberOfRows: number) {
  const pathBooleans: number[][] = []
  const pathCells: PathCell[][] = []
  // Generate arrays of false/true for each row
  // Total paths is 2^numberOfRows
  const AMOUNT_OF_VARIABLES = numberOfRows

  for (let i = 0; i < 1 << AMOUNT_OF_VARIABLES; i++) {
    const boolArr = []

    // Increasing or decreasing depending on which direction
    // you want your array to represent the binary number
    for (let j = AMOUNT_OF_VARIABLES - 1; j >= 0; j--) {
      const is_left = i & (1 << j) ? 0 : 1
      boolArr.push(is_left)
    }

    pathBooleans.push(boolArr)
  }

  for (let i = 0; i < pathBooleans.length; i++) {
    const newPath = makePathFromLeftRightArray(pathBooleans[i])
    pathCells.push(newPath)
  }

  return { pathCells, pathBooleans }
}

export function makePathFromLeftRightArray(
  leftRightArray: number[],
): PathCell[] {
  const path: PathCell[] = []
  let prev_col = 0
  for (let i = 0; i < leftRightArray.length; i++) {
    const row = i + 1
    const is_left = !!leftRightArray[i]
    const column = is_left ? prev_col : prev_col + 1
    path.push({
      row,
      column,
    })
    prev_col = column
  }
  return path
}

export function getHoleFromBallPath(path: PathCell[]) {
  return path[path.length - 1].column
}
export function getHoleFromBallPathGeneralized(
  path: PathCell[],
  numberOfRows: number,
) {
  try {
    return path[numberOfRows - 1].column
  } catch (e) {
    return numberOfRows + 53 // Invalid hole
  }
}

export function calculateExtraMultiplierFromPath(
  multiplierCells: SpecialCell[],
  path: PathCell[],
): number {
  return path.reduce(
    (total, cell) =>
      total + getPegMultiplier(multiplierCells, cell.row, cell.column),
    0,
  )
}

export function getMultipliersHitOnPath(
  multiplierCells: SpecialCell[],
  path: PathCell[],
): SpecialCell[] {
  return path.reduce((total: SpecialCell[], cell) => {
    const multiplier = getPegMultiplier(multiplierCells, cell.row, cell.column)
    if (multiplier > 0) {
      total.push({
        row: cell.row,
        column: cell.column,
        multiplier,
      })
    }
    return total
  }, [])
}

export function getNumberOfPathsThatHitCell(
  paths: PathCell[][],
  testCell: PathCell,
): number {
  return paths.reduce((total, path) => {
    if (path[testCell.row - 1].column === testCell.column) {
      total++
    }
    return total
  }, 0)
}

export function getCountOfCellInCellArray(
  cell: SpecialCell,
  cellArray: SpecialCell[],
) {
  return cellArray.reduce((total, cell_) => {
    if (cell.row === cell_.row && cell.column === cell_.column) {
      total++
    }
    return total
  }, 0)
}

/**
 * Calculate the probablities of each hole given a specific cell hit on the path
 * This is used to determine the payout adjustments needed from bonus peg multipliers
 * The result is an array of numbers are between 0 and 1.
 */
export function getHolesProbabilitiesGivenCell(
  numberOfRows: number,
  cell: PathCell,
): number[] {
  const probabilities: number[] = []
  // populate probabilities for each row
  for (let holes = 0; holes < numberOfRows; holes++) {
    probabilities.push(0)
  }
  // Calculate probabilities for each hole
  const reducedRows = numberOfRows - cell.row
  const holeOffset = cell.column
  const smallPascal = getHolesProbabilities(reducedRows)
  for (let i = 0; i < smallPascal.length; i++) {
    const probability = smallPascal[i]
    const hole = i + holeOffset
    probabilities[hole] = probability
  }

  return probabilities
}

/**
 * Returns a number between 0 and 1.
 */
export function getProbabilityOfCell(cell: PathCell): number {
  const reducedRows = cell.row
  const smallPascal = getHolesProbabilities(reducedRows)
  const probability = smallPascal[cell.column]
  return probability
}

export function getPayoutAdjustmentsForCell(
  numberOfRows: number,
  cell: SpecialCell,
): number[] {
  const adjustments: number[] = []

  const cell_probability = getProbabilityOfCell(cell)
  const holes_probability = getHolesProbabilitiesGivenCell(numberOfRows, cell)
  for (let hole = 0; hole < holes_probability.length; hole++) {
    const adjustment =
      cell_probability * holes_probability[hole] * (cell.multiplier - 1)
    adjustments.push(adjustment)
  }
  return adjustments
}

export function getCellProbabilityGivenHole(
  numRows: number,
  cell: PathCell,
  hole: number,
): number {
  // A: probability of cell
  // B: probability of hole
  // p(AnB): probability of cell and hole
  // p(A|B): probability of cell given hole
  // p(A|B) = p(AnB) / p(B)
  const probability_A = getProbabilityOfCell(cell)
  const probability_B = getHolesProbabilities(numRows)[hole]
  const probability_B_given_A = getHolesProbabilitiesGivenCell(numRows, cell)[
    hole
  ]
  const probability_A_and_B = probability_B_given_A * probability_A
  const probability_A_given_B = probability_A_and_B / probability_B
  return probability_A_given_B
}

/**
 * Use this to check probability of hitting another multiplier after already hitting one
 */
export function getCellProbabilityGivenCell(
  cell_already_hit: PathCell,
  cell_to_check: PathCell,
): number {
  // NOTE Also check for probability of hitting the rolled hole and all the other multipliers
  const probabilities: number[] = []
  const numberOfCells = cell_to_check.row
  // populate probabilities for each row
  for (let holes = 0; holes < numberOfCells; holes++) {
    probabilities.push(0)
  }
  // Calculate probabilities for each hole
  const reducedRows = numberOfCells - cell_already_hit.row
  const holeOffset = cell_already_hit.column
  const smallPascal = getHolesProbabilities(reducedRows)
  for (let i = 0; i < smallPascal.length; i++) {
    const probability = smallPascal[i]
    const hole = i + holeOffset
    probabilities[hole] = probability
  }

  return probabilities[cell_to_check.column]
}
