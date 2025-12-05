import * as test from '../test'
import {
  YGGDRASIL_API_BASE_URL,
  YGGDRASIL_PROVIDER_NAME,
  YggdrasilInvalidGameIdError,
  YggdrasilInvalidOpError,
  isYggdrasilPlayerInfoRequest,
  type YggdrasilOpValidatorType,
} from '../types'
import {
  getApiUrl,
  getYggdrasilEvent,
  getYggdrasilOp,
  getYggdrasilOpValidator,
  getYggdrasilValidator,
  internalIdForYggId,
  parseQueryToObject,
  yggdrasilTypeToCategory,
} from './utils'

describe('Internal ID Generation', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Converts An ID As Expected',
      inputs: {
        yggdrasilId: '123',
      },
      expects: {
        throws: false,
        internalId: `${YGGDRASIL_PROVIDER_NAME}:123`,
      },
    },
    {
      name: 'Throws An Error When ID Is Empty',
      inputs: {
        yggdrasilId: '',
      },
      expects: {
        throws: new YggdrasilInvalidGameIdError('', expect.any(String)),
      },
    },
    {
      name: 'Throws An Error When ID Is Missing',
      inputs: {
        yggdrasilId: undefined as unknown as string,
      },
      expects: {
        throws: new YggdrasilInvalidGameIdError(
          'undefined',
          expect.any(String),
        ),
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { yggdrasilId } = inputs
    const { throws, internalId } = expects
    test.getMockedLogger() // Silence logger
    if (throws !== false && typeof throws === 'object') {
      expect(() => internalIdForYggId(yggdrasilId)).toThrow(throws)
    } else {
      expect(internalIdForYggId(yggdrasilId)).toBe(internalId)
    }
  })
})

describe('API URL Generation', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Generates URL As Expected',
      inputs: {
        path: 'games',
      },
      expects: {
        url: `${YGGDRASIL_API_BASE_URL}/games`,
      },
    },
    {
      name: 'Generates URL With Empty Path',
      inputs: {
        path: '',
      },
      expects: {
        url: `${YGGDRASIL_API_BASE_URL}`,
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { path } = inputs
    const { url } = expects
    test.getMockedLogger() // Silence logger
    expect(getApiUrl(path)).toBe(url)
  })
})

describe('Yggdrasil Type To Category', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Converts A Valid Type As Expected',
      inputs: {
        type: 'slots',
      },
      expects: {
        category: 'slots',
      },
    },
    {
      name: 'Converts An Invalid Type To Slots',
      inputs: {
        type: 'invalid',
      },
      expects: {
        category: 'slots',
      },
    },
    {
      name: 'Converts An Mapped Type To Slots',
      inputs: {
        type: 'slot',
      },
      expects: {
        category: 'slots',
      },
    },
    {
      name: 'Converts A Valid Type With Different Case As Expected',
      inputs: {
        type: 'Slots',
      },
      expects: {
        category: 'slots',
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { type } = inputs
    const { category } = expects
    expect(yggdrasilTypeToCategory(type)).toBe(category)
  })
})

describe('Yggdrasil Op Parsing', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Parses Operation As Expected',
      inputs: {
        path: '/playerinfo.json',
      },
      expects: {
        throws: false,
        operation: 'playerinfo',
        calls: {
          logger: { 0: [] },
        },
      },
    },
    {
      name: 'Throws An Error When Operation Is Invalid',
      inputs: {
        path: '/games.json',
      },
      expects: {
        throws: new YggdrasilInvalidOpError('games', expect.any(String)),
        operation: 'games',
        calls: {
          logger: { 0: [] },
        },
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { path } = inputs
    const { operation, throws, calls } = expects

    // Mock logger
    const logger = test.getMockedLogger()

    if (throws !== false && typeof throws === 'object') {
      expect(() => getYggdrasilOp({ path } as any)).toThrow(throws)
    } else {
      expect(getYggdrasilOp({ path } as any)).toBe(operation)
    }

    // Verify logger calls
    expect(logger.error).toHaveBeenCalledWithNthArgs(
      calls.logger,
      'logger.error',
    )
  })
})

describe('Yggdrasil Op Validator', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Validates Operation As Expected',
      inputs: {
        op: 'playerinfo',
      },
      expects: {
        throws: false,
        validator: isYggdrasilPlayerInfoRequest,
      },
    },
    {
      name: 'Throws An Error When Operation Is Invalid',
      inputs: {
        op: 'games',
      },
      expects: {
        throws: new YggdrasilInvalidOpError('games', expect.any(String)),
        calls: {
          loggerError: {
            1: [
              'The Operation Is Not Valid',
              { gameId: 'N/A', operation: 'games' },
            ],
          },
        },
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { op } = inputs
    const { throws, validator, calls } = expects

    // Mock logger
    const logger = test.getMockedLogger()

    if (throws !== false && typeof throws === 'object') {
      expect(() => getYggdrasilOpValidator(op as any)).toThrow(throws)
      expect(logger.error).toHaveBeenCalledWithNthArgs(
        calls.loggerError,
        'logger.error',
      )
    } else {
      let validatorFn: YggdrasilOpValidatorType | undefined
      expect(() => {
        validatorFn = getYggdrasilOpValidator(op as any)
      }).not.toThrow()
      expect(validatorFn).toBe(validator)
    }
  })
})

describe('Yggdrasil Request Validator', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Validates Operation As Expected',
      inputs: {
        req: {
          path: '/playerinfo.json',
        },
      },
      expects: {
        throws: false,
      },
    },
    {
      name: 'Throws An Error When Operation Is Invalid',
      inputs: {
        req: {
          path: '/games.json',
        },
      },
      expects: {
        throws: new YggdrasilInvalidOpError('games', expect.any(String)),
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { req } = inputs
    const { throws } = expects

    // Mock logger
    test.getMockedLogger()

    if (throws !== false && typeof throws === 'object') {
      expect(() => getYggdrasilValidator(req as any)).toThrow(throws)
    } else {
      expect(() => getYggdrasilValidator(req as any)).not.toThrow()
    }
  })
})

describe('Parse Query To Object', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Parses Query As Expected',
      inputs: {
        path: '/playerinfo.json',
        url: '/playerinfo.json?org=YourOrgName&sessiontoken=dc7e81db760c466a890274a9c153c349&lang=no&version=5&cat1=Casino&cat2=Slot&cat3=StickyJ&cat4=Joker+Millions&cat5=7312&tag1=GameName.Joker+Millions&tag2=Model.M1&tag3=Channel.pc',
        headers: { host: 'pambet.test' },
      },
      expects: {
        op: 'playerinfo',
        data: {
          org: 'YourOrgName',
          sessionToken: 'dc7e81db760c466a890274a9c153c349',
          lang: 'no',
          version: '5',
          categories: ['Casino', 'Slot', 'StickyJ', 'Joker Millions', '7312'],
          tags: ['GameName.Joker Millions', 'Model.M1', 'Channel.pc'],
        },
      },
    },
    {
      name: 'Parses Query With Empty Data',
      inputs: {
        path: '/playerinfo.json',
        url: '/playerinfo.json',
        headers: { host: 'pambet.test' },
      },
      expects: {
        op: 'playerinfo',
        data: {},
      },
    },
    {
      name: 'Parses Query With Categories & Tags',
      inputs: {
        path: '/playerinfo.json',
        url: '/playerinfo.json?org=YourOrgName&sessiontoken=dc7e81db760c466a890274a9c153c349&lang=no&version=5&cat1=Casino&cat2=Slot&cat3=StickyJ&cat4=Joker+Millions&cat5=7312&tag1=GameName.Joker+Millions&tag2=Model.M1&tag3=Channel.pc',
        headers: { host: 'pambet.test' },
      },
      expects: {
        op: 'playerinfo',
        data: {
          org: 'YourOrgName',
          sessionToken: 'dc7e81db760c466a890274a9c153c349',
          lang: 'no',
          version: '5',
          categories: ['Casino', 'Slot', 'StickyJ', 'Joker Millions', '7312'],
          tags: ['GameName.Joker Millions', 'Model.M1', 'Channel.pc'],
        },
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { path, url, headers } = inputs
    const { op, data } = expects
    const req = { path, url, headers } as any
    const result = parseQueryToObject(req)

    expect(result.op).toBe(op)
    expect(result.data).toEqual(data)
  })
})

describe('Get Yggdrasil Event', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  const cases = [
    {
      name: 'Parses Event As Expected',
      inputs: {
        req: {
          path: '/playerinfo.json',
          url: '/playerinfo.json?org=YourOrgName&sessiontoken=dc7e81db760c466a890274a9c153c349&lang=no&version=5&cat1=Casino&cat2=Slot&cat3=StickyJ&cat4=Joker+Millions&cat5=7312&tag1=GameName.Joker+Millions&tag2=Model.M1&tag3=Channel.pc',
          headers: { host: 'pambet.test' },
        },
      },
      expects: {
        throws: false,
        op: 'playerinfo',
        data: {
          org: 'YourOrgName',
          sessionToken: 'dc7e81db760c466a890274a9c153c349',
          lang: 'no',
          version: '5',
          categories: ['Casino', 'Slot', 'StickyJ', 'Joker Millions', '7312'],
          tags: ['GameName.Joker Millions', 'Model.M1', 'Channel.pc'],
        },
      },
    },
    {
      name: 'Throws An Error When Data Is Invalid',
      inputs: {
        req: {
          path: '/playerinfo.json',
          url: '/playerinfo.json',
          headers: { host: 'pambet.test' },
        },
      },
      expects: {
        throws: new YggdrasilInvalidOpError('playerinfo', expect.any(String)),
        calls: {
          loggerError: {
            1: [
              'The Operation Is Not Valid',
              { gameId: 'N/A', operation: 'playerinfo' },
            ],
          },
        },
      },
    },
    {
      name: 'Throws An Error When Op Is Invalid',
      inputs: {
        req: {
          path: '/games.json',
          url: '/games.json',
          headers: { host: 'pambet.test' },
        },
      },
      expects: {
        throws: new YggdrasilInvalidOpError('games', expect.any(String)),
        calls: {
          loggerError: {
            1: [
              'The Operation Is Not Valid',
              { gameId: 'N/A', operation: 'games' },
            ],
          },
        },
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { req } = inputs
    const { op, data, throws, calls } = expects

    const logger = test.getMockedLogger()
    const validator = (() => {
      try {
        return getYggdrasilValidator(req as any)
      } catch (err) {
        // Forcing a fake validator to confine test to getting events
        return getYggdrasilValidator({
          path: '/playerinfo.json',
          url: '/playerinfo.json',
          headers: { host: 'pambet.test' },
        } as any)
      }
    })()

    if (throws !== false && typeof throws === 'object') {
      expect(() => getYggdrasilEvent(req as any, validator)).toThrow(throws)
      expect(logger.error).toHaveBeenCalledWithNthArgs(
        calls.loggerError,
        'logger.error',
      )
    } else {
      const result = getYggdrasilEvent(req as any, validator)
      expect(result.op).toBe(op)
      expect(result.data).toEqual(data)
    }
  })
})
