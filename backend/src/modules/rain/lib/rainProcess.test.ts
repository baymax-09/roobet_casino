import { mockRain } from '../../../../test/mocks/rain'

import * as TimerModule from 'src/util/helpers/timer'

import {
  RainStatus,
  countdownState,
  endedState,
  activeState,
  runRain,
} from './rainProcess'

jest.mock('src/util/helpers/timer', () => ({
  sleep: jest.fn(),
}))

jest.mock('../documents/rain', () => ({
  payoutAllRainUsers: jest.fn(),
  changeRainStatus: jest.fn(),
}))

describe('rainProcess.ts', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('countdownState', () => {
    it('returns valid', async () => {
      const result = await countdownState(mockRain)
      expect(result.newStatus).toBe(RainStatus.Active)
      expect(typeof result.timeToWait).toBe('number')
    })
  })

  describe('activeState', () => {
    it('returns valid', async () => {
      const result = await activeState(mockRain)
      expect(result.newStatus).toBe(RainStatus.Ended)
      expect(typeof result.timeToWait).toBe('number')
    })
  })

  describe('endedState', () => {
    it('returns valid', async () => {
      const result = await endedState(mockRain)
      expect(result.newStatus).toBeNull()
      expect(result.timeToWait).toBe(1000)
    })
  })

  describe('runRain', () => {
    it('processes a new Rain', async () => {
      const sleepSpy = jest.spyOn(TimerModule, 'sleep')
      await runRain(mockRain)
      expect(sleepSpy).toHaveBeenCalledTimes(3)
    })

    it('processes a countdown Rain', async () => {
      const sleepSpy = jest.spyOn(TimerModule, 'sleep')
      const rain = {
        ...mockRain,
        status: RainStatus.Active,
      }
      await runRain(rain)
      expect(sleepSpy).toHaveBeenCalledTimes(2)
    })

    it('processes a finished Rain', async () => {
      const sleepSpy = jest.spyOn(TimerModule, 'sleep')
      const rain = {
        ...mockRain,
        status: RainStatus.Ended,
      }
      await runRain(rain)
      expect(sleepSpy).toHaveBeenCalledTimes(1)
    })
  })
})
