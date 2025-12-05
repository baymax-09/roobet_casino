import { isObject } from './object'

const simpleTestCases = [
  {
    desc: 'return false for null',
    args: null,
    expected: false,
  },
  {
    desc: 'return false for undefined',
    args: undefined,
    expected: false,
  },
  {
    desc: 'return true for an empty POJO',
    args: {},
    expected: true,
  },
  {
    desc: 'return true for a POJO with entries',
    args: { foo: 'bar', baz: 'quux' },
    expected: true,
  },
  {
    desc: 'return false for an array',
    args: [],
    expected: false,
  },
]

describe('src/util/helpers/object', function () {
  describe('#isObject', () => {
    it.each(simpleTestCases)('$desc', ({ args, expected }) => {
      expect(isObject(args)).toBe(expected)
    })
  })
})
