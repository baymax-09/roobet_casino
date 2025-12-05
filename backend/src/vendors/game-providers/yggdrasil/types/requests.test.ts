import {
  isYggdrasilBaseRequest,
  isYggdrasilBaseSessionRequest,
  isYggdrasilCatTagRequest,
  isYggdrasilLangRequest,
  isYggdrasilPlayerInfoRequest,
} from './requests'

describe('Base Request', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const cases = [
    {
      name: 'Validates A Proper Request',
      inputs: {
        req: {
          org: 'test',
        },
      },
      expects: {
        isValid: true,
      },
    },
    {
      name: 'Invalidates A Improper Request',
      inputs: {
        req: {},
      },
      expects: {
        isValid: false,
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { req } = inputs
    const { isValid } = expects

    const result = isYggdrasilBaseRequest(req)
    expect(result).toBe(isValid)
  })
})

describe('Base Session Request', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const cases = [
    {
      name: 'Validates A Proper Request',
      inputs: {
        req: {
          org: 'test',
          sessionToken: 'test',
        },
      },
      expects: {
        isValid: true,
      },
    },
    {
      name: 'Invalidates A Improper Request',
      inputs: {
        req: {
          org: 'test',
        },
      },
      expects: {
        isValid: false,
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { req } = inputs
    const { isValid } = expects

    const result = isYggdrasilBaseSessionRequest(req)
    expect(result).toBe(isValid)
  })
})

describe('Base Lang Request', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const cases = [
    {
      name: 'Validates A Proper Request',
      inputs: {
        req: {
          org: 'test',
          lang: 'en',
        },
      },
      expects: {
        isValid: true,
      },
    },
    {
      name: 'Invalidates A Improper Request',
      inputs: {
        req: {
          org: 'test',
        },
      },
      expects: {
        isValid: false,
      },
    },
    {
      name: 'Invalidates A Improper Length Request',
      inputs: {
        req: {
          org: 'test',
          lang: 'english',
        },
      },
      expects: {
        isValid: false,
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { req } = inputs
    const { isValid } = expects

    const result = isYggdrasilLangRequest(req)
    expect(result).toBe(isValid)
  })
})

describe('Cat Tag Request', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const cases = [
    {
      name: 'Validates A Proper Request',
      inputs: {
        req: {
          org: 'test',
          categories: ['test'],
          tags: ['test'],
        },
      },
      expects: {
        isValid: true,
      },
    },
    {
      name: 'Validates An Empty Request',
      inputs: {
        req: {
          org: 'test',
          categories: [],
          tags: [],
        },
      },
      expects: {
        isValid: true,
      },
    },
    {
      name: 'Invalidates A Improper Request',
      inputs: {
        req: {
          org: 'test',
          categories: [5],
          tags: [12],
        },
      },
      expects: {
        isValid: false,
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { req } = inputs
    const { isValid } = expects

    const result = isYggdrasilCatTagRequest(req)
    expect(result).toBe(isValid)
  })
})

describe('Player Info Request', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const cases = [
    {
      name: 'Validates A Proper Request',
      inputs: {
        req: {
          org: 'test',
          sessionToken: 'test',
          lang: 'en',
        },
      },
      expects: {
        isValid: true,
      },
    },
    {
      name: 'Invalidates A Improper Request',
      inputs: {
        req: {
          org: '',
          sessionToken: '',
          lang: '',
        },
      },
      expects: {
        isValid: false,
      },
    },
  ]

  it.each(cases)('$name', ({ inputs, expects }) => {
    const { req } = inputs
    const { isValid } = expects

    const result = isYggdrasilPlayerInfoRequest(req)
    expect(result).toBe(isValid)
  })
})
