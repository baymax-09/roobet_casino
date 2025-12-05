import { compareGrantsToRequest } from '../resolve'
import { testRoles } from './testData'

const simpleCompareGrantsToRequestTestCases = [
  {
    desc: 'Super-Admin can do stuff.',
    args: [
      [testRoles['Super-Admin']],
      [
        { resource: 'account', action: 'update' },
        { resource: 'balances', action: 'reset' },
      ],
    ],
    expected: true,
  },
  {
    desc: 'Unusable-Super-Admin cannot do stuff.',
    args: [
      [testRoles['Unusable-Super-Admin']],
      [
        { resource: 'account', action: 'update' },
        { resource: 'balances', action: 'reset' },
      ],
    ],
    expected: false,
  },
  {
    desc: 'Basic-Staff can reset balances but not delete chat.',
    args: [
      [testRoles['Unusable-Super-Admin']],
      [
        { resource: 'chat', action: 'delete' },
        { resource: 'balances', action: 'reset' },
      ],
    ],
    expected: false,
  },
]

const complexCompareGrantsToRequestTestCases = [
  {
    desc: 'Super-Admin + Basic-Staff can do stuff.',
    args: [
      [testRoles['Super-Admin'], testRoles['Basic-Staff']],
      [
        { resource: 'account', action: 'update' },
        { resource: 'balances', action: 'reset' },
      ],
    ],
    expected: true,
  },
  {
    desc: 'Super-Admin + Unusable-Super-Admin cannot do stuff.',
    args: [
      [testRoles['Super-Admin'], testRoles['Unusable-Super-Admin']],
      [
        { resource: 'account', action: 'update' },
        { resource: 'balances', action: 'reset' },
      ],
    ],
    expected: false,
  },
  {
    desc: 'Basic-Staff cannot read withdrawals by lacking allow.',
    args: [
      [testRoles['Basic-Staff'], testRoles['Basic-Staff-Two']],
      [{ resource: 'withdrawals', action: 'read' }],
    ],
    expected: false,
  },
  {
    desc: 'Basic-Staff-Two cannot delete chat by possessing a wildcard deny on chat.',
    args: [
      [testRoles['Basic-Staff'], testRoles['Basic-Staff-Two']],
      [{ resource: 'chat', action: 'delete' }],
    ],
    expected: false,
  },
  {
    desc: 'Basic-Staff-Three can create slot potatoes with a wildcard allow.',
    args: [
      [
        testRoles['Basic-Staff'],
        testRoles['Basic-Staff-Two'],
        testRoles['Basic-Staff-Three'],
      ],
      [{ resource: 'slot_potato', action: 'create' }],
    ],
    expected: true,
  },
]

describe('src/modules/rbac/lib/resolve', function () {
  describe('#compareGrantsToRequest', () => {
    describe('individual roles with combined policies', () => {
      it.each(simpleCompareGrantsToRequestTestCases)(
        '$desc',
        ({ args, expected }) => {
          expect(compareGrantsToRequest(...args)).toStrictEqual(expected)
        },
      )
    })

    describe('combined roles', () => {
      it.each(complexCompareGrantsToRequestTestCases)(
        '$desc',
        ({ args, expected }) => {
          expect(compareGrantsToRequest(...args)).toStrictEqual(expected)
        },
      )
    })
  })
})
