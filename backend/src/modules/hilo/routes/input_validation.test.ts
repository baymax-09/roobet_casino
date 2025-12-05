/**
 * Hilo Input validation tests
 *
 * @group hilo/input
 * @group input
 * @group housegame
 */

import { validateRollInputs } from './input_validation'

jest.mock('src/system', () => ({
  config: {},
}))

describe('modules/hilo/routes/index', function () {
  describe('#validateRollInputs', function () {
    it('validates route inputs for hilo roll', function () {
      const clientSeed = 'clientSeed' // Good seed
      const mode = 'under'
      // PASSING TESTS
      {
        const amount = '1'
        const targetNumber = '50'
        expect(() => {
          validateRollInputs(clientSeed, amount, mode, targetNumber)
        }).not.toThrow()
      }

      // FAILING TESTS
      {
        const clientSeed = 'a'.repeat(26)
        const amount = '1'
        const targetNumber = '50'
        expect(() => {
          validateRollInputs(clientSeed, amount, mode, targetNumber)
        }).toThrow()
      }
      {
        const amount = '1'
        const targetNumber = ''
        expect(() => {
          validateRollInputs(clientSeed, amount, mode, targetNumber)
        }).toThrow()
      }
      {
        const amount = '1'
        const targetNumber = '0'
        expect(() => {
          validateRollInputs(clientSeed, amount, mode, targetNumber)
        }).toThrow()
      }
      {
        const amount = '1'
        const targetNumber = '100'
        expect(() => {
          validateRollInputs(clientSeed, amount, mode, targetNumber)
        }).toThrow()
      }
      {
        const amount = '1'
        const targetNumber = 'oops'
        expect(() => {
          validateRollInputs(clientSeed, amount, mode, targetNumber)
        }).toThrow()
      }
      {
        const amount = ''
        const targetNumber = '50'
        expect(() => {
          validateRollInputs(clientSeed, amount, mode, targetNumber)
        }).toThrow()
      }
      {
        const amount = 'oops'
        const targetNumber = '50'
        expect(() => {
          validateRollInputs(clientSeed, amount, mode, targetNumber)
        }).toThrow()
      }
    })
  })
})
