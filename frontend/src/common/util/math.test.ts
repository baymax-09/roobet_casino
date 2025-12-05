import { exponentialDelay } from './math'

describe('exponentialDelay', () => {
  it('defaults to 500', () => {
    expect(exponentialDelay()).toBe(500)
  })

  it('has a maximum of 10000', () => {
    expect(exponentialDelay(Number.MAX_SAFE_INTEGER)).toBe(10000)
  })

  it('increases delay exponentially per retryNumber parameter', () => {
    expect(exponentialDelay(1)).toBe(1000)
    expect(exponentialDelay(2)).toBe(2000)
    expect(exponentialDelay(3)).toBe(4000)
    expect(exponentialDelay(4)).toBe(8000)
    expect(exponentialDelay(5)).toBe(10000)
  })
})
