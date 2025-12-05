import { printPayoutArray } from './analysis'
import {
  type ManualRiskLevel,
  type RowNumber,
  getPayoutMultiplier,
} from './payout_list'

/**
 * Given a non-negative integer numRows,
 * generate the first numRows of Pascal's triangle.
 *
 * Time Complexity: O(n\*n),
 * Space Complexity: O(n\*n)
 *
 * generate(3) // [[1],[1,1],[1,2,1]]
 *
 * generate(4) // [[1],[1,1],[1,2,1],[1,3,3,1]]
 */
export function generatePascalTriangle(_numRows: number): number[][] {
  const numRows = _numRows + 1 // Client starts from 2nd row
  const triangle: number[][] = []
  let y = 0
  const shrunkOne = 1 // Use smaller base value to allow for very big number of rows (~1000)
  // Otherwise sum of last row will be infinite

  while (y < numRows) {
    if (y === 0) {
      // row 1
      triangle.push([shrunkOne])
    } else if (y === 1) {
      // row 2
      triangle.push([shrunkOne, shrunkOne])
    } else {
      // row n+1
      let x = 0
      const row = [shrunkOne]
      while (x < y - 1) {
        row.push(triangle[y - 1][x] + triangle[y - 1][x + 1])
        x += 1
      }
      row.push(shrunkOne)
      triangle.push(row)
    }
    y += 1
  }

  return triangle
}

/**
 * Calculate the array of cumulative probablities of a given plinko board.
 * This is used to determine the outcome of a plinko roll
 * i.e. which hole the ball lands in.
 * The result is an array of numbers are between 0 and 1.
 */
export function getHolesProbabilitiesCumulative(numRows: number): number[] {
  const triangle = generatePascalTriangle(numRows)
  const lastRow = triangle[triangle.length - 1]
  const sumOfLastRow = lastRow.reduce((a, b) => a + b, 0)
  if (!Number.isFinite(sumOfLastRow)) {
    throw new Error(`sumOfLastRow is not finite: ${sumOfLastRow}`)
  }

  let cumulativeWeight = 0
  const cumulativeWeights = lastRow.map(value => {
    cumulativeWeight += value
    return cumulativeWeight
  })

  // normalize probabilities
  const probabilitiesCumulative = cumulativeWeights.map(
    value => value / sumOfLastRow,
  )

  return probabilitiesCumulative
}

/**
 * Calculate the array of probablities of each result for a given plinko board.
 * This is used to determine the payout of a plinko roll.
 * The result is an array of numbers are between 0 and 1.
 */
export function getHolesProbabilities(numRows: number): number[] {
  const triangle = generatePascalTriangle(numRows)
  const lastRow = triangle[triangle.length - 1]
  const sumOfLastRow = lastRow.reduce((a, b) => a + b, 0)

  // normalize probabilities
  const probabilities = lastRow.map(value => value / sumOfLastRow)

  return probabilities
}

export function determineHoleFromRoll(roll: number, rows: number): number {
  const cumulativeWeight = getHolesProbabilitiesCumulative(rows)
  let hole = 0
  for (let i = 0; i < cumulativeWeight.length; i++) {
    if (roll <= cumulativeWeight[i]) {
      hole = i
      break
    }
  }
  return hole
}

export function getPayoutMultiplierForHole(
  hole: number,
  riskLevel: ManualRiskLevel,
  rows: RowNumber,
) {
  let env_edge = process.env.PLINKO_HOUSE_EDGE
  if (!env_edge) {
    env_edge = '1'
  }
  const edge: number = parseFloat(env_edge)
  const payout = getPayoutMultiplier(hole, rows, riskLevel, edge)

  return parseFloat(payout.toFixed(4))
}

export function verifyPayoutAverage(
  payoutArray: number[],
  probabilities: number[],
  edge: number,
) {
  // verify that the average payout fromt the weighted probablities is equal to
  // win chance minus house edge
  const payoutAverage = calculatePayoutAverage(payoutArray, probabilities)

  const expectedPayoutAverage = 1 - edge / 100
  const error = Math.abs(payoutAverage - expectedPayoutAverage)
  if (error > 0.005) {
    const message = `Expected payout average ${expectedPayoutAverage} but got ${payoutAverage.toFixed(
      4,
    )} for payout array ${printPayoutArray(payoutArray)}`
    return { result: false, message }
  } else {
    return { result: true, message: '' }
  }
}

export function calculatePayoutAverage(
  payoutArray: number[],
  probabilities: number[],
): number {
  return payoutArray.reduce(
    (acc, payout, index) => payout * probabilities[index] + acc,
    0,
  )
}
