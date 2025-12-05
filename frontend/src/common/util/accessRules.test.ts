import { hasAccess } from './accessRules'

describe('hasAccess', () => {
  it('returns false when users have no matching rules', () => {
    expect(hasAccess({ userRules: [], rules: ['test:test'] })).toBe(false)
  })

  it('return false when a userRule partially matches a rule', () => {
    const userRules = ['stats:read']
    const rules = ['global_stats:read']
    expect(hasAccess({ userRules, rules })).toBe(false)
  })

  it('returns true when users have matching rules', () => {
    expect(
      hasAccess({
        userRules: ['test:noMatch', 'test:test'],
        rules: ['test:test'],
      }),
    ).toBe(true)
  })

  it('returns true when users have matching wildcard rules', () => {
    expect(
      hasAccess({
        userRules: ['test:*', '*:*', '*:test', '*'],
        rules: ['test:test'],
      }),
    ).toBe(true)
  })
})
