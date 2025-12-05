import { gameResultFromHash } from './hash'

describe('hash.ts', () => {
  beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockReturnValue(1)
  })

  afterEach(() => {
    jest.spyOn(global.Math, 'random').mockRestore()
  })

  describe('gameResultFromHash', () => {
    it('returns 3', async () => {
      const { winningNumber } = await gameResultFromHash('F')
      expect(winningNumber).toBe(3)
    })

    it('returns 2', async () => {
      const { winningNumber } = await gameResultFromHash('1235')
      expect(winningNumber).toBe(2)
    })

    it('returns 1', async () => {
      const { winningNumber } = await gameResultFromHash('123456')
      expect(winningNumber).toBe(1)
    })
  })
})
