import { errorMap } from '../constants'
import { generateUnsuccessfulResponse, txAmountToNumber } from './util'

describe('paymentiq/lib/util', () => {
  describe('generateUnsuccessfulResponse', () => {
    it('should have a default error message', () => {
      const response = generateUnsuccessfulResponse({
        userId: '123',
        externalId: '456',
      })

      expect(response.errCode).toBe(errorMap.UNKNOWN_ERROR.errCode)
    })
  })

  describe('txAmountToNumber', () => {
    it('should have a default return value', () => {
      const response = txAmountToNumber('asdf')

      expect(response).toBe(0.0)
    })
  })
})
