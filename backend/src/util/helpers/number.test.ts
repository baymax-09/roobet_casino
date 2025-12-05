import { PositiveIntegerV } from './number'

const simpleTestCases = [
  {
    desc: 'return false for negative integer',
    arg: -1,
    expected: false,
  },
  {
    desc: 'return true for positive integer',
    arg: 1,
    expected: true,
  },
  {
    desc: 'return false for negative decimal',
    arg: -0.01,
    expected: false,
  },
  {
    desc: 'return false for positive decimal',
    arg: 0.01,
    expected: false,
  },
  {
    desc: 'return false for string',
    arg: '1',
    expected: false,
  },
]

describe('src/util/helpers/number', function () {
  describe('#PositiveInteger', () => {
    it.each(simpleTestCases)('$desc', ({ arg, expected }) => {
      expect(PositiveIntegerV.is(arg)).toStrictEqual(expected)
    })
  })
})
