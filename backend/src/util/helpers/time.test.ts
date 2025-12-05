import {
  getEvenDuration,
  isAfter,
  addTimeInMs,
  getDurationInMs,
  subtractTimeInMs,
  timeIsBetween,
} from './time'

describe('time util', () => {
  describe('getEvenDuration', () => {
    it('should return the even duration between two times', () => {
      const startTime = '2020-01-01T00:00:00.000Z'
      const endTime = '2020-01-02T00:00:00.000Z'
      const dividedBy = 2
      const result = getEvenDuration(startTime, endTime, dividedBy)
      expect(result).toBe((1000 * 60 * 60 * 24) / 2)
    })
  })
  describe('isAfter', () => {
    it('should correctly return if a time is after another time', () => {
      const time1 = '2020-01-01T00:00:00.000Z'
      const time2 = '2020-01-02T00:00:00.000Z'
      const result = isAfter(time1, time2)
      const result2 = isAfter(time2, time1)
      expect(result).toBe(false)
      expect(result2).toBe(true)
    })
  })

  describe('getFutureDate', () => {
    it('should return a date in the future', () => {
      const date = addTimeInMs(
        1000 * 60 * 60 * 24,
        new Date('January 1, 1984 00:00:00'),
      )
      const expectedDate = new Date('January 2, 1984 00:00:00')
      expect(date).toEqual(expectedDate)
    })
  })

  describe('getDurationInMs', () => {
    it('should reutrn a duration in ms based on a Duration enum', () => {
      const expected = getDurationInMs(1, 'd')
      expect(expected).toBe(1000 * 60 * 60 * 24)
    })
  })
  describe('subtractTimeInMs', () => {
    it('should return a date in the past', () => {
      const date = subtractTimeInMs(
        1000 * 60 * 60 * 24,
        new Date('January 2, 1984 00:00:00'),
      )
      const expectedDate = new Date('January 1, 1984 00:00:00')
      expect(date).toEqual(expectedDate)
    })
  })
  describe('addTimeInMs', () => {
    it('should return a date in the future', () => {
      const date = addTimeInMs(
        1000 * 60 * 60 * 24,
        new Date('January 1, 1984 00:00:00'),
      )
      const expectedDate = new Date('January 2, 1984 00:00:00')
      expect(date).toEqual(expectedDate)
    })
  })
  describe('timeIsBetween', () => {
    it('should return true if a time is between two other times', () => {
      const time1 = '2020-01-01T00:00:00.000Z'
      const time2 = '2020-01-02T00:00:00.000Z'
      const tweener = '2020-01-01T12:00:00.000Z'
      const notTween = '2020-02-01T12:00:00.000Z'
      const result = timeIsBetween(tweener, time1, time2)
      const result2 = timeIsBetween(notTween, time2, time1)
      expect(result).toBe(true)
      expect(result2).toBe(false)
    })
  })
})
