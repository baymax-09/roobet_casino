import { saltWithClientSeed } from '../../game/lib/provably_fair/sharedAlgorithms'

import {
  getPayoutList,
  type ManualRiskLevel,
  ManualRiskLevels,
  RowNumbers,
} from './payout_list'
import * as fs from 'fs'
import { buildRandomBools } from '../../game/lib/shuffle'
import {
  calculateBallPath,
  calculateExtraMultiplierFromPath,
  generateEveryPossiblePath,
  getHoleFromBallPath,
  getHoleFromBallPathGeneralized,
  LIGHTNING_BOARD_ROW_NUMBERS,
  type PathCell,
  type SpecialCell,
} from './lightning_board'
import {
  generateBasePayoutsIterative,
  generateGuaranteedPayouts,
  generateLightningPayouts,
} from './payout_generator'
import { getHolesProbabilities } from './board'

jest.mock('src/system', () => ({
  config: {
    config: {
      plinko: {
        edge: process.env.PLINKO_HOUSE_EDGE,
      },
    },
  },
}))

describe.skip('modules/plinko/lib/roll1', function () {
  describe('#plinkoRoll', function () {
    // NOTE We do not want this test to run on CI builds

    const edge_standard = parseFloat(process.env.PLINKO_HOUSE_EDGE || '1') // NOTE Should use config, but may break tests
    const edge_lightning = parseFloat(
      process.env.PLINKO_LIGHTNING_HOUSE_EDGE || '4',
    ) // NOTE Should use config, but may break tests

    const edgeToPass = edge_standard

    const csvRows = [
      [
        'passedStatus',
        'generation',
        'payouts',
        'riskLevel',
        'numberOfRows',
        'totalIterations',
        'expectedRtp',
        'actualRtp',
        'rtpError',
      ],
    ]

    const lightningBoardSeed = 'qqywfucfpvgfrprspgwfcl0239'
    const clientSeed = 'nicemusicforworkinginthebackground'
    const totalIterations = 1000000
    // const maxHashesPrecalculated = 1000000
    // const nReadlines = require('n-readlines');

    const multiplierCellsExtra = []
    const { pathCells } = generateEveryPossiblePath(LIGHTNING_BOARD_ROW_NUMBERS)
    // const { payouts, multiplierCells } = generateLightningPayouts(lightningBoardSeed, edge_lightning, pathCells, LIGHTNING_BOARD_ROW_NUMBERS, multiplierCellsExtra)

    // const riskLevel = 'high'
    ManualRiskLevels.forEach(riskLevel => {
      // const numberOfRows = 16
      RowNumbers.forEach(numberOfRows => {
        it('Searches in the payout space for the payouts that pass RTP test', function () {
          // const pathLiner = new nReadlines(`../paths_${maxHashesPrecalculated}_${clientSeed}.txt`);

          const idealPayouts = getPayoutList(
            numberOfRows,
            riskLevel as ManualRiskLevel,
            edgeToPass,
          )
          let iterateDown = false // We are starting with the guaranteed payouts, so we want to iterate up
          const guaranteedPayouts = generateGuaranteedPayouts(
            numberOfRows,
            edgeToPass,
          )
          const probabilities = getHolesProbabilities(numberOfRows)
          let currentPayouts = guaranteedPayouts
          let lastGoodPayouts = guaranteedPayouts
          let lastBadPayouts = idealPayouts
          let lastPassedcsvRow: string[] = []
          for (let generation = 0; generation < 20; generation++) {
            currentPayouts = generateBasePayoutsIterative(
              currentPayouts,
              lastGoodPayouts,
              lastBadPayouts,
              iterateDown,
              probabilities,
            )

            const actualRTP = simulateRollsToCalculateActualRTP(
              totalIterations,
              clientSeed,
              numberOfRows,
              riskLevel,
              currentPayouts,
              multiplierCellsExtra,
              0,
            )
            const expectedRTP = (100 - edgeToPass) / 100

            // console.log("Average RTP for risk:" + riskLevel + " row:" + numberOfRows + " is:", actualRTP)
            // console.log("Expected RTP for risk:" + riskLevel + " row:" + numberOfRows + " is:", expectedPayoutAverage)
            const errorRTP = Math.abs(actualRTP - expectedRTP) / expectedRTP
            const isPassed = errorRTP < 0.005 // 0.5% error
            iterateDown = !isPassed // If we failed, we want to iterate down to the guaranteed payouts, if we passed, we want to iterate up to the ideal payouts
            if (isPassed) {
              lastGoodPayouts = currentPayouts
            } else {
              lastBadPayouts = currentPayouts
            }

            if (isPassed) {
              // Save to CSV
              const passedStatus = isPassed ? 'PASS' : 'FAIL'
              const roundedPayouts: number[] = currentPayouts.map(
                value => value,
              )
              let stringifiedPayouts: string = JSON.stringify(roundedPayouts)
              stringifiedPayouts = stringifiedPayouts.replace(/,/g, ';')
              lastPassedcsvRow = [
                passedStatus,
                generation.toFixed(0),
                stringifiedPayouts,
                riskLevel,
                numberOfRows.toFixed(0),
                totalIterations.toFixed(0),
                (expectedRTP * 100).toFixed(2),
                (actualRTP * 100).toFixed(2),
                (errorRTP * 100).toFixed(2),
              ]
            }
          }
          if (lastPassedcsvRow.length > 0) {
            csvRows.push(lastPassedcsvRow)
          }
          expect(0).toBeCloseTo(0, 2)
        })
      })
    })

    afterAll(() => {
      const csvContent = csvRows.map(e => e.join(',')).join('\n')

      const fileName = 'rtp_correction_' + Date.now()

      fs.writeFileSync(`${fileName}.csv`, csvContent)
    })
  })
})

describe.skip('modules/plinko/lib/roll2', function () {
  describe('#plinkoRoll', function () {
    // NOTE We do not want this test to run on CI builds

    const edge_standard = parseFloat(process.env.PLINKO_HOUSE_EDGE || '1') // NOTE Should use config, but may break tests
    const edge_lightning = parseFloat(
      process.env.PLINKO_LIGHTNING_HOUSE_EDGE || '4',
    ) // NOTE Should use config, but may break tests

    const csvRows = [
      [
        'passedStatus',
        'riskLevel',
        'numberOfRows',
        'totalIterations',
        'expectedRtp',
        'actualRtp',
        'rtpError',
        'fileGeneration',
      ],
    ]

    const lightningBoardSeed = 'qqywfucfpvgfrprspgwfcl0239'
    const clientSeed = 'nicemusicforworkinginthebackground'
    const totalIterations = 1000000
    // const maxHashesPrecalculated = 1000000
    // const nReadlines = require('n-readlines');

    const multiplierCellsExtra = []
    const { pathCells } = generateEveryPossiblePath(LIGHTNING_BOARD_ROW_NUMBERS)
    const { payouts, multiplierCells } = generateLightningPayouts(
      lightningBoardSeed,
      edge_lightning,
      pathCells,
      LIGHTNING_BOARD_ROW_NUMBERS,
      multiplierCellsExtra,
    )

    // const riskLevel = 'high'
    // const numberOfRows = 16
    for (let fileGeneration = 0; fileGeneration < 10; fileGeneration++) {
      // const pathLiner = new nReadlines(`../
      ManualRiskLevels.forEach(riskLevel => {
        RowNumbers.forEach(numberOfRows => {
          const isLightning: boolean = riskLevel === 'lightning'
          if (isLightning && LIGHTNING_BOARD_ROW_NUMBERS !== numberOfRows) {
            return
          }
          it('Simulates rolls using current payouts to check for RTP', function () {
            const payoutsStandard = getPayoutList(
              numberOfRows,
              riskLevel as ManualRiskLevel,
              edge_standard,
            )
            const payoutsToPass = isLightning ? payouts : payoutsStandard
            const edgeToPass = isLightning ? edge_lightning : edge_standard

            const actualRTP = simulateRollsToCalculateActualRTP(
              totalIterations,
              clientSeed,
              numberOfRows,
              riskLevel,
              payoutsToPass,
              multiplierCells,
              fileGeneration,
            )
            const expectedRTP = (100 - edgeToPass) / 100

            // console.log("Average RTP for risk:" + riskLevel + " row:" + numberOfRows + " is:", actualRTP)
            // console.log("Expected RTP for risk:" + riskLevel + " row:" + numberOfRows + " is:", expectedPayoutAverage)
            const errorRTP = Math.abs(actualRTP - expectedRTP) / expectedRTP
            const isPassed = errorRTP < 0.005
            const passedStatus = isPassed ? 'PASS' : 'FAIL'
            csvRows.push([
              passedStatus,
              riskLevel,
              numberOfRows.toFixed(0),
              totalIterations.toFixed(0),
              (expectedRTP * 100).toFixed(2),
              (actualRTP * 100).toFixed(2),
              (errorRTP * 100).toFixed(2),
              fileGeneration.toFixed(0),
            ])
            expect(0).toBeCloseTo(0, 2)
          })
        })
      })
    }

    afterAll(() => {
      // let csvContent = "data:text/csv;charset=utf-8," +
      const csvContent = csvRows.map(e => e.join(',')).join('\n')

      const fileName = 'rtp_trend_' + Date.now()

      fs.writeFileSync(`${fileName}.csv`, csvContent)
    })
  })
})

describe.skip('modules/plinko/lib/roll3', function () {
  describe('#plinkoRoll', function () {
    // NOTE We do not want this test to run on CI builds
    const zlib = require('zlib')

    const clientSeed = 'nicemusicforworkinginthebackground'
    const totalIterations = 1000000
    const numberOfRows = LIGHTNING_BOARD_ROW_NUMBERS
    // const fileGeneration = 0
    for (let fileGeneration = 0; fileGeneration < 10; fileGeneration++) {
      it('Generates txt file of paths to reuse for testing', function () {
        let paths = ''
        for (let iterations = 0; iterations < totalIterations; iterations++) {
          const shuffleNonce = iterations + fileGeneration * totalIterations
          const newHash = saltWithClientSeed(
            clientSeed,
            shuffleNonce.toString(),
          )
          const shuffledGroup: number[] = buildRandomBools(
            numberOfRows,
            newHash,
          ) // This returns numberOfRows numbers that are either 0 or 1
          const path: PathCell[] = calculateBallPath(
            shuffledGroup,
            numberOfRows,
          )

          const input = JSON.stringify(path)
          paths += input + '\n'

          // Compression is disabled because it causes SIGKILL
          // zlib.deflate(input, (err, buffer) => {
          //   if (err) {
          //     console.log('u-oh')
          //   }

          //   const final = buffer.toString('base64')
          //   paths += final + "\n"
          // })
        }
        fs.writeFile(
          `../paths_${totalIterations}_${clientSeed}_gen${fileGeneration}.txt`,
          paths + '\n',
          err => {
            if (err) {
              console.error(err)
            }
          },
        )
        expect(0).toBeCloseTo(0, 2)
      })
    }
  })
})

function simulateRollsToCalculateActualRTP(
  totalIterations: number,
  clientSeed: string,
  numberOfRows: number,
  riskLevel: string,
  payouts: number[],
  multiplierCells: SpecialCell[],
  fileGeneration: number,
) {
  // const zlib = require('zlib')

  const calculatedPayouts: number[] = []

  // let line;
  const maxHashesPrecalculated = 1000000

  let lineCounter = 0
  const fileName = `../paths_${maxHashesPrecalculated}_${clientSeed}_gen${fileGeneration}.txt`
  // const nReadlines = require('n-readlines');
  // const pathLiner = new nReadlines(fileName);

  // while (line = pathLiner.next() && lineCounter < totalIterations) {
  const allFileContents = fs.readFileSync(fileName, 'utf-8')
  allFileContents.split(/\r?\n/).forEach(line => {
    if (lineCounter >= totalIterations) {
      return
    }
    lineCounter++
    // line = line.toString('ascii');

    // let uncompressed_line = zlib.inflateSync(Buffer.from(line, 'base64')).toString('ascii');

    const path: PathCell[] = JSON.parse(line)
    if (!path) {
      console.error('No path found on line: ', line)
      return
    }

    const hole = getHoleFromBallPathGeneralized(path, numberOfRows)

    let holeMultiplier = 1
    let cellsMultiplier = 1
    if (riskLevel === 'lightning') {
      holeMultiplier = payouts[hole]
      cellsMultiplier = calculateExtraMultiplierFromPath(multiplierCells, path)
    } else {
      // const payoutList = getPayoutList(numberOfRows, riskLevel as ManualRiskLevel, edge_standard)
      // const payoutList = generateGuaranteedPayouts(numberOfRows, edge_standard);
      holeMultiplier = payouts[hole]
      if (!holeMultiplier) {
        console.error('No hole multiplier found for hole: ', hole)
        return
      }
    }

    const payoutMultiplier =
      holeMultiplier * (cellsMultiplier > 0 ? cellsMultiplier : 1)
    calculatedPayouts.push(payoutMultiplier)
  })
  // }

  if (calculatedPayouts.length < totalIterations) {
    console.error(
      'Not enough iterations found. Expected: ',
      totalIterations,
      ' Actual: ',
      calculatedPayouts.length,
    )
  }
  if (calculatedPayouts.length > totalIterations) {
    console.warn(
      'Too many iterations found. Expected: ',
      totalIterations,
      ' Actual: ',
      calculatedPayouts.length,
    )
  }

  const actualRTP =
    calculatedPayouts.reduce((acc, payout, index) => payout + acc, 0) /
    calculatedPayouts.length
  return actualRTP
}

describe.skip('modules/plinko/lib/roll4', function () {
  describe('#plinkoRoll', function () {
    // NOTE We do not want this test to run on CI builds

    const clientSeed = 'nicemusicforworkinginthebackground'
    const totalIterations = 1000000
    const numberOfRows = LIGHTNING_BOARD_ROW_NUMBERS
    // let holes: number[] = []
    let holesString = ''
    // let holesString = "hole:\n"
    const generation = 10
    it('Generates csv of holes to use for external analysis', function () {
      for (let iterations = 0; iterations < totalIterations; iterations++) {
        const shuffleNonce = iterations + generation * totalIterations
        const newHash = saltWithClientSeed(clientSeed, shuffleNonce.toString())
        const shuffledGroup: number[] = buildRandomBools(numberOfRows, newHash) // This returns numberOfRows numbers that are either 0 or 1
        const path: PathCell[] = calculateBallPath(shuffledGroup, numberOfRows)
        const hole = getHoleFromBallPath(path)

        // holes.push(hole)
        holesString += hole + '\n'
      }
      fs.appendFile(
        `../holes_${totalIterations}_${clientSeed}_gen${generation}.csv`,
        holesString + '\n',
        err => {
          if (err) {
            console.error(err)
          }
        },
      )
      expect(0).toBeCloseTo(0, 2)
    })
  })
})

describe.skip('modules/plinko/lib/roll5', function () {
  describe('#plinkoRoll', function () {
    // NOTE We do not want this test to run on CI builds

    const clientSeed = 'nicemusicforworkinginthebackground'
    const numberOfRows = LIGHTNING_BOARD_ROW_NUMBERS
    // let holes: number[] = []
    let holesString = 'holes\n'
    const { pathCells } = generateEveryPossiblePath(numberOfRows)
    it('Generates holes of every path combination to use for exernal analysis', function () {
      for (let iterations = 0; iterations < pathCells.length; iterations++) {
        const path: PathCell[] = pathCells[iterations]
        const hole = getHoleFromBallPath(path)

        // holes.push(hole)
        holesString += hole + '\n'
      }
      fs.appendFile(
        `../holes_${pathCells.length}_${numberOfRows}_rows.csv`,
        holesString + '\n',
        err => {
          if (err) {
            console.error(err)
          }
        },
      )
      expect(0).toBeCloseTo(0, 2)
    })
  })
})
