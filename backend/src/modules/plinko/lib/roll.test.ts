import {
  getPayoutForEdge,
  getPayoutList,
  type ManualRiskLevel,
  RiskLevels,
} from './payout_list'
import {
  calculateExtraMultiplierFromPath,
  generateEveryPossiblePath,
  getHoleFromBallPath,
  LIGHTNING_BOARD_ROW_NUMBERS,
} from './lightning_board'
import { generateLightningPayouts } from './payout_generator'

jest.mock('src/system', () => ({
  config: {
    config: {
      plinko: {
        edge: process.env.PLINKO_HOUSE_EDGE,
      },
    },
  },
}))

// describe('modules/plinko/lib/roll', function () {
//   describe('#plinkoRoll', function () {
//     it('rolls a number to determine which hole the ball falls in', function () {

//       RiskLevels.forEach(
//         (riskLevel, someNumber) => {
//           RowNumbers.forEach(numberOfRows => {
//             // const numberOfRows = 16
//             // const riskLevel = "NA"
//             // console.log("RiskLevel: ", riskLevel, "NumberOfRows: ", numberOfRows)
//             const hash = "q29384vk7qc234q2203q9vk4qmaxf"
//             // let payouts = []
//             let holes: number[] = []
//             // const totalIterations = numberOfRows * 1000
//             const totalIterations = 100000

//             const cumulativeWeight = calculatePlinkoProbabilitiesCumulative(numberOfRows)
//             // console.log("Cumulative Weight: %o", cumulativeWeight)
//             for (let iterations = 0; iterations < totalIterations; iterations++) {
//               const shuffleNonce = iterations
//               const newHash = saltWithClientSeed(hash, shuffleNonce.toString())

//               const roll = rollNumber(newHash)

//               const hole = determineHoleFromRollCached(roll, cumulativeWeight)
//               holes.push(hole)
//               // console.log("Hole: ", hole)
//               // console.log("iterations: ", iterations)
//             }

//             describeData(holes, numberOfRows)
//             const fileName = `plinko_${riskLevel}_${numberOfRows}_${totalIterations}`
//             saveData(holes, fileName, "holes")

//           })
//         })
//     })
//   })
// })

describe('modules/plinko/lib/roll', function () {
  describe('#plinkoRoll', function () {
    it('rolls a number to determine which hole the ball falls in', function () {
      const edge_standard = parseFloat(process.env.PLINKO_HOUSE_EDGE || '1') // NOTE Should use config, but may break tests
      const edge_lightning = parseFloat(
        process.env.PLINKO_LIGHTNING_HOUSE_EDGE || '4',
      ) // NOTE Should use config, but may break tests

      const numberOfRows = 16
      const boardSeed = 'qqywfucfpvgfrprspgwfcl0239'
      const clientSeed = 'nicemusicforworkinginthebackground'

      const multiplierCellsExtra = []

      const { pathCells } = generateEveryPossiblePath(numberOfRows)
      const { payouts, multiplierCells } = generateLightningPayouts(
        boardSeed,
        edge_lightning,
        pathCells,
        LIGHTNING_BOARD_ROW_NUMBERS,
        multiplierCellsExtra,
      )
      // console.log("Payouts: %o", payouts)
      // console.log("Multiplier Cells: %o", multiplierCells)
      const totalIterations = pathCells.length // 100000 //

      RiskLevels.forEach(riskLevel => {
        const calculatedPayouts: number[] = []
        for (let iterations = 0; iterations < totalIterations; iterations++) {
          // const shuffleNonce = iterations
          // const newHash = saltWithClientSeed(clientSeed, shuffleNonce.toString())
          // const shuffledGroup: number[] = buildGroup(100, newHash) // This returns 100 numbers between 0 and 100
          // const path = calculateBallPath(shuffledGroup, numberOfRows)

          const path = pathCells[iterations]
          const hole = getHoleFromBallPath(path)

          let holeMultiplier = 1
          let cellsMultiplier = 1
          if (riskLevel === 'lightning') {
            holeMultiplier = payouts[hole]
            cellsMultiplier = calculateExtraMultiplierFromPath(
              multiplierCells,
              path,
            )
          } else {
            const payoutList = getPayoutList(
              numberOfRows,
              riskLevel as ManualRiskLevel,
              edge_standard,
            )
            holeMultiplier = payoutList[hole]
            if (!holeMultiplier) {
              console.log('Hole Multiplier: ', holeMultiplier)
              console.log('Payout List: ', payoutList)
              console.log(
                'PayoutLists[edge]: ',
                getPayoutForEdge(edge_standard),
              )
              console.log(
                'PayoutLists[edge][riskLevel]: ',
                getPayoutForEdge(edge_standard)[riskLevel],
              )
              console.log(
                'PayoutLists[edge][riskLevel][numberOfRows]: ',
                getPayoutForEdge(edge_standard)[riskLevel][numberOfRows],
              )
              console.log('Path: ', path)
              console.log('Hole: ', hole)
              console.log('Risk Level: ', riskLevel)
              console.log('Number of Rows: ', numberOfRows)
              console.log('Edge Standard: ', edge_standard)
              break
            }
          }

          const payoutMultiplier =
            holeMultiplier * (cellsMultiplier > 0 ? cellsMultiplier : 1)
          calculatedPayouts.push(payoutMultiplier)
        }

        const average =
          calculatedPayouts.reduce((acc, payout, index) => payout + acc, 0) /
          calculatedPayouts.length
        const expectedPayoutAverage =
          (100 - (riskLevel === 'lightning' ? edge_lightning : edge_standard)) /
          100

        console.log(
          'Average RTP for ' + riskLevel + ':',
          average.toFixed(4) + ' and expected ' + expectedPayoutAverage,
        )
        const averageError =
          Math.abs(average - expectedPayoutAverage) / expectedPayoutAverage
        expect(averageError).toBeCloseTo(0, 2)
      })
    })
  })
})
