import { createMoment, buildTimestampFilter } from './date'

// TODO: this test sucks because moment-timezone sucks, go figure it out
describe('createMoment', () => {
  Date.now = jest.fn(() => 1643733522119)
  it('will create a moment object based on timestamp argument', () => {
    expect(createMoment().format()).toMatch('2022-02-01T10:38:42-06:00')
  })
})

describe('buildTimestampFilter', () => {
  it('will return a filter object if provided start, end', () => {
    const today = createMoment(new Date(1643733522119))
    const yesterday = createMoment(today)

    expect(buildTimestampFilter(yesterday, today)).toEqual({
      $gte: '2022-02-01T06:00:00.000Z',
      $lte: '2022-02-02T05:59:59.999Z',
    })
  })

  it('will return an empty object if no args', () => {
    expect(buildTimestampFilter()).toEqual({})
  })
})
