import { expandWildCard } from '../resolve'

const simpleExpandWildCardTestCases = [
  {
    desc: 'Wildcard action expands to all actions.',
    args: 'withdrawals:*',
    expected: [
      'withdrawals:read',
      'withdrawals:read_flagged',
      'withdrawals:update',
      'withdrawals:update_flagged',
    ],
  },
  {
    desc: 'Explicit action expands to itself.',
    args: 'withdrawals:read',
    expected: ['withdrawals:read'],
  },
]

describe('src/modules/rbac/lib/resolve', function () {
  describe('#expandWildCard', () => {
    it.each(simpleExpandWildCardTestCases)('$desc', ({ args, expected }) => {
      expect(expandWildCard(args)).toStrictEqual(expected)
    })
  })
})
