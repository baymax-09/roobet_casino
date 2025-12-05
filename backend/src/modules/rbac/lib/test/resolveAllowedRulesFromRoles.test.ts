import { resolveAllowedRulesFromRoles } from '../resolve'
import { testRoles } from './testData'

const simpleResolveAllowedRulesFromRolesTestCases = [
  {
    desc: 'Double wildcard on one role should just be double wildcard.',
    args: [testRoles['Super-Admin']],
    expected: ['*:*'],
  },
  {
    desc: 'Wild card allow and wild card deny on one role should deny all.',
    args: [testRoles['Unusable-Super-Admin']],
    expected: [],
  },
  {
    desc: 'Simple allows should combine on one role.',
    args: [testRoles['Basic-Staff']],
    expected: ['balances:*', 'chat:read', 'content:read', 'content:update'],
  },
  {
    desc: 'Subtract a wildcard deny from explicit allow and an explicit deny from a wildcard allow on one role.',
    args: [testRoles['Basic-Staff-Two']],
    expected: [
      'balances:add',
      'balances:mktg',
      'balances:vip',
      'balances:vip_bulk',
      'content:read',
      'content:update',
    ],
  },
]

const complexResolveAllowedRulesFromRolesTestCases = [
  {
    desc: 'Double wild card allow and deny on multiple roles should deny all.',
    args: [testRoles['Super-Admin'], testRoles['Unusable-Super-Admin']],
    expected: [],
  },
  {
    desc: 'Allows on multiple roles should combine.',
    args: [testRoles['Basic-Staff'], testRoles['Basic-Staff-Three']],
    expected: [
      'balances:*',
      'chat:read',
      'content:read',
      'content:update',
      'slot_potato:*',
      'withdrawals:read',
    ],
  },
  {
    desc: 'Allows and denies on multiple roles should combine.',
    args: [
      testRoles['Basic-Staff'],
      testRoles['Basic-Staff-Two'],
      testRoles['Basic-Staff-Three'],
    ],
    expected: [
      'balances:add',
      'balances:mktg',
      'balances:vip',
      'balances:vip_bulk',
      'content:read',
      'content:update',
      'slot_potato:*',
      'withdrawals:read',
    ],
  },
]

describe('src/modules/rbac/lib/resolve', function () {
  describe('#resolveAllowedRulesFromRoles', () => {
    describe('individual roles with combined policies', () => {
      it.each(simpleResolveAllowedRulesFromRolesTestCases)(
        '$desc',
        ({ args, expected }) => {
          expect(resolveAllowedRulesFromRoles(args)).toStrictEqual(expected)
        },
      )
    })

    describe('combined roles', () => {
      it.each(complexResolveAllowedRulesFromRolesTestCases)(
        '$desc',
        ({ args, expected }) => {
          expect(resolveAllowedRulesFromRoles(args)).toStrictEqual(expected)
        },
      )
    })
  })
})
