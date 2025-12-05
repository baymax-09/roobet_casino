import { validate } from './validators'

describe('Bulk Actions cell validator', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const cases = [
    {
      name: 'number rejects NaN',
      inputs: {
        data: NaN,
        type: 'number',
      },
      expects: false,
    },
    {
      name: 'number approves number',
      inputs: {
        data: 2,
        type: 'number',
      },
      expects: true,
    },
    {
      name: 'number rejects string',
      inputs: {
        data: '2',
        type: 'number',
      },
      expects: false,
    },
    {
      name: 'string approves string',
      inputs: {
        data: '2',
        type: 'string',
      },
      expects: true,
    },
    {
      name: 'string rejects number',
      inputs: {
        data: 2,
        type: 'string',
      },
      expects: false,
    },
    {
      name: 'boolean approves true',
      inputs: {
        data: 'true',
        type: 'boolean',
      },
      expects: true,
    },
    {
      name: 'boolean rejects number',
      inputs: {
        data: 2,
        type: 'boolean',
      },
      expects: false,
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { data, type } = inputs
    const actual = validate(data, type)
    expect(actual).toBe(expects)
  })
})
