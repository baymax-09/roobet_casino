import { stringOfLength, yggdrasilErrorResponse } from './common'
import { YggdrasilError } from './errors'
import { YggdrasilErrorCodes } from './responses'

describe('String Of Length', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  const cases = [
    {
      name: 'Ensure Valid String Of Length',
      inputs: {
        input: 'test',
        min: 4,
        max: 4,
      },
      expects: {
        throws: false,
        result: 'test',
      },
    },
    {
      name: 'Throws When Not A String',
      inputs: {
        input: 123,
        min: 3,
        max: 3,
      },
      expects: {
        throws: new Error('Input MUST be a string'),
      },
    },
    {
      name: 'Throws When String Fails Length Checks',
      inputs: {
        input: 'test',
        min: 5,
        max: 10,
      },
      expects: {
        throws: new Error('Input string is not between specified min and max'),
      },
    },
    {
      name: 'Truncates String When Forced',
      inputs: {
        input: 'testing things is fun, not really',
        min: 0,
        max: 21,
        force: true,
      },
      expects: {
        throws: false,
        result: 'testing things is fun',
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { input, min, max, force } = inputs
    const { throws, result } = expects

    if (throws !== false && typeof throws === 'object') {
      expect(() => {
        stringOfLength(input, max, min, force)
      }).toThrow(throws)
    } else {
      expect(stringOfLength(input, max, min, force)).toBe(result)
    }
  })
})

describe('Error Response', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const cases = [
    {
      name: 'Convert Error To Response',
      inputs: {
        error: new YggdrasilError('test', 'test'),
      },
      expects: {
        response: {
          code: YggdrasilErrorCodes.AnyOtherError,
          msg: 'test',
        },
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { error } = inputs
    const { response } = expects

    const result = yggdrasilErrorResponse(error)
    expect(result).toEqual(response)
  })
})
