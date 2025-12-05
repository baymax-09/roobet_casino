import { fillMissingDays } from './affiliateEarnings'

const sevenDaysAgo = '2024-03-06T00:00:00.000Z'
const middleDay = '2024-03-09T00:00:00.000Z'
const lastDay = '2024-03-12T00:00:00.000Z'

// I picked these dates so that we would cross a DST change (03/10/2024)
const sevenEmptyDays = [
  {
    sum: 0,
    time: '2024-03-06T00:00:00.000Z',
  },
  {
    sum: 0,
    time: '2024-03-07T00:00:00.000Z',
  },
  {
    sum: 0,
    time: '2024-03-08T00:00:00.000Z',
  },
  {
    sum: 0,
    time: '2024-03-09T00:00:00.000Z',
  },
  {
    sum: 0,
    time: '2024-03-10T00:00:00.000Z',
  },
  {
    sum: 0,
    time: '2024-03-11T00:00:00.000Z',
  },
  {
    sum: 0,
    time: '2024-03-12T00:00:00.000Z',
  },
]

const simpleTestCases = [
  {
    desc: 'return nothing for no earnings',
    args: [[], sevenDaysAgo, 7],
    expected: [],
  },
  {
    desc: 'do nothing if all days are already present',
    args: [sevenEmptyDays, sevenDaysAgo, 7],
    expected: sevenEmptyDays,
  },
  {
    desc: 'return 7 days with just the starting date',
    args: [[{ time: sevenDaysAgo, sum: 0 }], sevenDaysAgo, 7],
    expected: sevenEmptyDays,
  },
  {
    desc: 'return 7 days with just the end date',
    args: [[{ time: lastDay, sum: 0 }], sevenDaysAgo, 7],
    expected: sevenEmptyDays,
  },
  {
    desc: 'return 7 days with just the end date and middle date',
    args: [
      [
        { time: middleDay, sum: 0 },
        { time: lastDay, sum: 0 },
      ],
      sevenDaysAgo,
      7,
    ],
    expected: sevenEmptyDays,
  },
  {
    desc: 'return 7 days with just the middle date',
    args: [[{ time: middleDay, sum: 0 }], sevenDaysAgo, 7],
    expected: sevenEmptyDays,
  },
]

describe('src/modules/affiliate/documents/affiliateEarnings', function () {
  describe('#fillMissingDays', () => {
    it.each(simpleTestCases)('$desc', ({ args, expected }) => {
      expect(fillMissingDays(...args)).toStrictEqual(expected)
    })
  })
})
