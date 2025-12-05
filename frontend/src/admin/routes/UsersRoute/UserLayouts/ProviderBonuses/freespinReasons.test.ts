import {
  handleReasons,
  OTHER_REASON,
  providerFreespinReasons,
} from './freespinReasons'

describe('Freespin Reasons', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const validReason = providerFreespinReasons[0]
  const validOther = 'Valid Freespin Reason'
  const invalidOther = undefined

  const cases = [
    {
      name: 'Returns Reason As Expected',
      inputs: {
        reason: validReason,
        other: invalidOther,
      },
      expects: {
        final: validReason,
      },
    },
    {
      name: 'Returns Other As Expected',
      inputs: {
        reason: OTHER_REASON,
        other: validOther,
      },
      expects: {
        final: `Other - ${validOther}`,
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { reason, other } = inputs
    const { final } = expects
    const actual = handleReasons(inputs)
    expect(actual).toBe(final)
  })
})
