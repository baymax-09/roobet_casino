/**
 * Dice Input validation tests
 *
 * @group dice/input
 * @group input
 * @group housegame
 */

import { validateRollInputs } from './input_validation'

jest.mock('src/system', () => ({
  config: {},
}))

describe('modules/dice/routes/index', function () {
  describe('#validateRollInputs', function () {
    it('validates route inputs for traditional modes (over and under)', function () {
      const clientSeed = 'clientSeed' // Good seed
      const dicemode = 'under'
      // PASSING TESTS
      {
        const amount = '1'
        const targetNumber = '50'
        expect(() => {
          validateRollInputs(clientSeed, amount, dicemode, targetNumber)
        }).not.toThrow()
      }

      // FAILING TESTS
      {
        const clientSeed = 'a'.repeat(26)
        const amount = '1'
        const targetNumber = '50'
        expect(() => {
          validateRollInputs(clientSeed, amount, dicemode, targetNumber)
        }).toThrow()
      }
      {
        const amount = '1'
        const targetNumber = ''
        expect(() => {
          validateRollInputs(clientSeed, amount, dicemode, targetNumber)
        }).toThrow()
      }
      {
        const amount = '1'
        const targetNumber = '0'
        expect(() => {
          validateRollInputs(clientSeed, amount, dicemode, targetNumber)
        }).toThrow()
      }
      {
        const amount = '1'
        const targetNumber = '100'
        expect(() => {
          validateRollInputs(clientSeed, amount, dicemode, targetNumber)
        }).toThrow()
      }
      {
        const amount = '1'
        const targetNumber = 'oops'
        expect(() => {
          validateRollInputs(clientSeed, amount, dicemode, targetNumber)
        }).toThrow()
      }
      {
        const amount = ''
        const targetNumber = '50'
        expect(() => {
          validateRollInputs(clientSeed, amount, dicemode, targetNumber)
        }).toThrow()
      }
      {
        const amount = 'oops'
        const targetNumber = '50'
        expect(() => {
          validateRollInputs(clientSeed, amount, dicemode, targetNumber)
        }).toThrow()
      }
    })

    it('validates route inputs for newer modes (between, outside, and between-sets)', function () {
      const clientSeed = 'clientSeed' // Good seed
      // PASSING TESTS
      {
        const dicemode = 'between'
        const amount = '1'
        const targetNumber = 20
        const targetNumberEnd = 40
        expect(() => {
          validateRollInputs(
            clientSeed,
            amount,
            dicemode,
            targetNumber,
            targetNumberEnd,
          )
        }).not.toThrow()
      }
      {
        const dicemode = 'outside'
        const amount = '1'
        const targetNumber = 20
        const targetNumberEnd = 40
        expect(() => {
          validateRollInputs(
            clientSeed,
            amount,
            dicemode,
            targetNumber,
            targetNumberEnd,
          )
        }).not.toThrow()
      }
      {
        const dicemode = 'between-sets'
        const amount = '1'
        const targetNumber = 20
        const targetNumberEnd = 40
        const targetNumber2 = 60
        const targetNumberEnd2 = 70
        expect(() => {
          validateRollInputs(
            clientSeed,
            amount,
            dicemode,
            targetNumber,
            targetNumberEnd,
            targetNumber2,
            targetNumberEnd2,
          )
        }).not.toThrow()
      }

      // FAILING TESTS
      {
        // Number range is too small
        const dicemode = 'between'
        const amount = '1'
        const targetNumber = 20
        const targetNumberEnd = 18
        expect(() => {
          validateRollInputs(
            clientSeed,
            amount,
            dicemode,
            targetNumber,
            targetNumberEnd,
          )
        }).toThrow()
      }
      {
        // Second number range is too small
        const dicemode = 'between-sets'
        const amount = '1'
        const targetNumber = 20
        const targetNumberEnd = 40
        const targetNumber2 = 60
        const targetNumberEnd2 = 50
        expect(() => {
          validateRollInputs(
            clientSeed,
            amount,
            dicemode,
            targetNumber,
            targetNumberEnd,
            targetNumber2,
            targetNumberEnd2,
          )
        }).toThrow()
      }
      {
        // Second number range overlaps first
        const dicemode = 'between-sets'
        const amount = '1'
        const targetNumber = 20
        const targetNumberEnd = 40
        const targetNumber2 = 30
        const targetNumberEnd2 = 50
        expect(() => {
          validateRollInputs(
            clientSeed,
            amount,
            dicemode,
            targetNumber,
            targetNumberEnd,
            targetNumber2,
            targetNumberEnd2,
          )
        }).toThrow()
      }
    })
  })
})
