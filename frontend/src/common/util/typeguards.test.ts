import { isFunction, isEmptyObject } from './typeguards'

describe('isFunction', () => {
  const fn = () => 'test'
  const obj = { testString: 'test' }
  const str = 'test'
  const num = 2

  it('can determine if argument is function', () => {
    expect(isFunction(fn)).toBe(true)
    expect(isFunction(obj)).toBe(false)
    expect(isFunction(str)).toBe(false)
    expect(isFunction(num)).toBe(false)
  })
})

describe('isEmptyObject', () => {
  const obj = { testString: 'test' }
  const emptyObj = {}
  it('can determine if argument is empty object', () => {
    expect(isEmptyObject(obj)).toBe(false)
    expect(isEmptyObject(emptyObj)).toBe(true)
  })
})
