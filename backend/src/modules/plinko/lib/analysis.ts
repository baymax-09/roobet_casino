import * as fs from 'fs'
import {
  type SpecialCell,
  existsInMultiplierArray,
  LIGHTNING_BOARD_ROW_NUMBERS,
  type PathCell,
} from './lightning_board'

import { plinkoLogger } from './logger'

export function describeHolesData(data: number[], numberOfRows: number) {
  const logger = plinkoLogger('describeHolesData', { userId: null })
  const average = data.reduce((a, b) => a + b, 0) / data.length
  logger.info(`plinkoAnalysis Average: ${average}`, { average })
  const standardDeviation = Math.sqrt(
    data.reduce((a, b) => a + Math.pow(b - average, 2), 0) / data.length,
  )
  logger.info(`plinkoAnalysis Standard Deviation: ${standardDeviation}`, {
    average,
    standardDeviation,
  })

  const oneStandardDeviation = average + standardDeviation
  const oneStandardDeviationBack = average - standardDeviation
  const twoStandardDeviation = average + 2 * standardDeviation
  const twoStandardDeviationBack = average - 2 * standardDeviation
  const threeStandardDeviation = average + 3 * standardDeviation
  const threeStandardDeviationBack = average - 3 * standardDeviation

  const withinOneStandardDeviation = data.filter(
    value => value <= oneStandardDeviation && value >= oneStandardDeviationBack,
  )
  const withinTwoStandardDeviation = data.filter(
    value => value <= twoStandardDeviation && value >= twoStandardDeviationBack,
  )
  const withinThreeStandardDeviation = data.filter(
    value =>
      value <= threeStandardDeviation && value >= threeStandardDeviationBack,
  )

  const withinOneStandardDeviationPercentage =
    withinOneStandardDeviation.length / data.length
  const withinTwoStandardDeviationPercentage =
    withinTwoStandardDeviation.length / data.length
  const withinThreeStandardDeviationPercentage =
    withinThreeStandardDeviation.length / data.length
  logger.info(
    `plinkoAnalysis Within 1 Standard Deviation: % ${
      withinOneStandardDeviationPercentage * 100
    }`,
    { average, standardDeviation, withinOneStandardDeviationPercentage },
  )
  logger.info(
    `plinkoAnalysis Within 2 Standard Deviation: % ${
      withinTwoStandardDeviationPercentage * 100
    }`,
    { average, standardDeviation, withinTwoStandardDeviationPercentage },
  )
  logger.info(
    `plinkoAnalysis Within 3 Standard Deviation: % ${
      withinThreeStandardDeviationPercentage * 100
    }`,
    { average, standardDeviation, withinThreeStandardDeviationPercentage },
  )

  // print median and mode of payouts array
  const sortedData = data.sort((a, b) => a - b)
  const median = sortedData[Math.floor(sortedData.length / 2)]
  logger.info(`plinkoAnalysis Median: ${median}`, {
    average,
    standardDeviation,
    median,
  })
  const mode = sortedData.reduce((a, b) => {
    if (a > b) {
      return a
    } else {
      return b
    }
  })
  logger.info(`plinkoAnalysis Mode: ${mode}`, {
    average,
    standardDeviation,
    median,
    mode,
  })
  const modeError = Math.abs(mode - average) / average
  const medianError = Math.abs(median - average) / average
  logger.info(`plinkoAnalysis Median error: ${medianError}`, {
    average,
    standardDeviation,
    median,
    mode,
    medianError,
  })
  logger.info(`plinkoAnalysis Mode error: ${modeError}`, {
    average,
    standardDeviation,
    median,
    mode,
    medianError,
    modeError,
  })
}

export function saveHolesData(
  data: number[],
  fileName: string,
  header: string,
) {
  plinkoLogger('saveHolesData', { userId: null }).info(
    `plinkoAnalysis Saving ${header} to: ${fileName}`,
    {
      header,
      fileName,
    },
  )

  const csv = `${header}\n${data.map(value => value.toString()).join('\n')}`
  fs.writeFileSync(`${fileName}.csv`, csv)
}

export function visualizePath(
  path: PathCell[],
  multiplierCells: SpecialCell[],
): string {
  const PEG_CHAR = 'O'
  const HIT_PEG_CHAR = 'X'
  let result = ''
  const TOTAL_ROWS = path.length
  const space_count = TOTAL_ROWS + 1

  result += 'row ' + 0 + ':\t'
  result += ' '.repeat(space_count)
  result += HIT_PEG_CHAR
  result += ' '.repeat(space_count)
  result += '\n'

  for (let _row = 1; _row < TOTAL_ROWS; _row++) {
    let row_string = 'row ' + _row + ':\t'
    const space_count = TOTAL_ROWS - _row + 1
    row_string += ' '.repeat(space_count)
    const marked_cell = path[_row - 1]
    for (let _col = 0; _col <= _row; _col++) {
      if (existsInMultiplierArray(multiplierCells, _row, _col)) {
        const multiplier =
          multiplierCells.find(
            cell => cell.row === _row && cell.column === _col,
          )?.multiplier || 1
        row_string += multiplier
        if (multiplier < 10) {
          row_string += ' '
        }
      } else if (_col === marked_cell.column) {
        row_string += HIT_PEG_CHAR
        row_string += ' '
      } else {
        row_string += PEG_CHAR
        row_string += ' '
      }
    }
    row_string += ' '.repeat(space_count)
    result += row_string + '\n'
  }

  const last_row = TOTAL_ROWS
  let row_string = 'hole:\t'
  const marked_cell = path[last_row - 1]
  row_string += '|'

  for (let _col = 0; _col <= last_row; _col++) {
    if (_col === marked_cell.column) {
      row_string += 'X'
    } else {
      row_string += ' '
    }
    row_string += '|'
  }
  result += row_string + '\n'

  row_string = 'hole: \t'

  row_string += ' '

  for (let _col = 0; _col <= last_row; _col++) {
    row_string += _col
    row_string += ' '
  }
  result += row_string + '\n'

  return result
}

export function printPayoutArray(payouts: number[]) {
  const for_display = payouts.map(value => value.toFixed(2))
  return for_display.join(', ') + ' -- length: ' + for_display.length
}

export function visualizeBoard(multiplierCells: SpecialCell[]): string {
  const PEG_CHAR = '.'
  const HIT_PEG_CHAR = 'X'
  let result = ''
  const TOTAL_ROWS = LIGHTNING_BOARD_ROW_NUMBERS
  const space_count = TOTAL_ROWS + 1

  result += 'row ' + 0 + ':\t'
  result += ' '.repeat(space_count)
  result += HIT_PEG_CHAR
  result += ' '.repeat(space_count)
  result += '\n'

  for (let _row = 1; _row < TOTAL_ROWS; _row++) {
    let row_string = 'row ' + _row + ':\t'
    const space_count = TOTAL_ROWS - _row + 1
    row_string += ' '.repeat(space_count)
    for (let _col = 0; _col <= _row; _col++) {
      if (existsInMultiplierArray(multiplierCells, _row, _col)) {
        const multiplier =
          multiplierCells.find(
            cell => cell.row === _row && cell.column === _col,
          )?.multiplier || 1
        row_string += multiplier
        if (multiplier < 10) {
          row_string += ' '
        }
      } else {
        row_string += PEG_CHAR
        row_string += ' '
      }
    }
    row_string += ' '.repeat(space_count)
    result += row_string + '\n'
  }

  const last_row = TOTAL_ROWS
  let row_string = 'hole:\t'
  row_string += '|'

  for (let _col = 0; _col <= last_row; _col++) {
    row_string += ' '
    row_string += '|'
  }
  result += row_string + '\n'

  row_string = 'hole: \t'

  row_string += ' '

  for (let _col = 0; _col <= last_row; _col++) {
    row_string += _col
    row_string += ' '
  }
  result += row_string + '\n'

  return result
}
