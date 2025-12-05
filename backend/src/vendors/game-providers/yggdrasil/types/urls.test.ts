import { v4 as uuidv4 } from 'uuid'
import { type Types as UserTypes } from '../../../../modules/user'
import * as utils from '../test'
import {
  YggdrasilUrlIntents,
  YggdrasilUrlRegions,
  getYggdrasilLaunchUrl,
  getYggdrasilLaunchUrlForUser,
  getYggdrasilUrl,
  type YggdrasilLaunchParams,
  type YggdrasilLaunchParamsDesktop,
  type YggdrasilLaunchParamsMobile,
} from './urls'

describe('Basic Urls', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const cases = YggdrasilUrlIntents.map(intent =>
    YggdrasilUrlRegions.map(region => ({
      name: `Get Url For ${intent[0].toUpperCase()}${intent.slice(
        1,
      )} in ${region[0].toUpperCase()}${region.slice(1)}`,
      intent,
      region,
    })),
  ).flat()

  it.each(cases)('$name', ({ intent, region }) => {
    const url = getYggdrasilUrl(intent, region)
    expect(url).toBeDefined()
    expect(url).toBeInstanceOf(URL)

    const urlString = url.toString()
    expect(urlString).toContain('static')
    expect(urlString).toMatch(/(staging|live|pff|-co)/)
    expect(urlString).toMatch(/^https.+\?$/)

    // Conditional expectations based on known patterns
    if (intent === 'test') {
      expect(urlString).toContain('staging')
    } else if (intent === 'live') {
      if (region === 'latam') {
        expect(urlString).toContain('static-co')
      } else {
        expect(urlString).toContain('live')
      }
    } else if (intent === 'fun') {
      expect(urlString).toContain('pff')
    }
  })
})

describe('Launch Urls', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const paramsBasic: YggdrasilLaunchParams = {
    key: utils.getObjectIdValue(),
    currency: 'USD',
    lang: 'en',
    gameId: 7301,
    org: 'roobet',
    channel: 'pc',
  }
  const paramsDesktop: YggdrasilLaunchParamsDesktop = {
    ...paramsBasic,
    channel: 'pc',
    fullscreen: 'no',
  }
  const paramsMobile: YggdrasilLaunchParamsMobile = {
    ...paramsBasic,
    channel: 'mobile',
    home: 'https://www.roobet.com/casino',
  }

  const cases = YggdrasilUrlIntents.map(intent =>
    YggdrasilUrlRegions.map(region => [
      {
        name: `Get Url For Mobile ${intent[0].toUpperCase()}${intent.slice(
          1,
        )} in ${region[0].toUpperCase()}${region.slice(1)}`,
        intent,
        region,
        params: paramsMobile,
      },
      {
        name: `Get Url For Desktop ${intent[0].toUpperCase()}${intent.slice(
          1,
        )} in ${region[0].toUpperCase()}${region.slice(1)}`,
        intent,
        region,
        params: paramsDesktop,
      },
    ]).flat(),
  ).flat()

  it.each(cases)('$name', ({ intent, region, params }) => {
    const url = getYggdrasilLaunchUrl(intent, region, params)
    const useParams = Object.entries(params).reduce(
      (pre, cur) => ({
        ...pre,
        ...(cur[1] ? { [cur[0].toLowerCase()]: cur[1] } : {}),
      }),
      {},
    )
    const query = new URLSearchParams(useParams)
    const queryPattern = new RegExp(`^https.+?${query.toString()}$`)

    expect(url).toBeDefined()
    expect(url).toBeInstanceOf(URL)

    const urlString = url.toString()
    expect(urlString).toContain('static')
    expect(urlString).toMatch(/(staging|live|pff|-co)/)
    expect(urlString).toMatch(queryPattern)
    expect(urlString).toContain('gameid=')

    // Conditional expectations based on known patterns
    if (intent === 'test') {
      expect(urlString).toContain('staging')
    } else if (intent === 'live') {
      if (region === 'latam') {
        expect(urlString).toContain('static-co')
      } else {
        expect(urlString).toContain('live')
      }
    } else if (intent === 'fun') {
      expect(urlString).toContain('pff')
    }
  })
})

describe('Launch Urls for Users', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const basicUser = { id: uuidv4() } as unknown as UserTypes.User
  const paramsBasic: YggdrasilLaunchParams = {
    key: '',
    currency: 'USD',
    lang: 'en',
    gameId: 7301,
    org: 'roobet',
    channel: 'pc',
  }
  const paramsDesktop: YggdrasilLaunchParamsDesktop = {
    ...paramsBasic,
    channel: 'pc',
    fullscreen: 'no',
  }
  const paramsMobile: YggdrasilLaunchParamsMobile = {
    ...paramsBasic,
    channel: 'mobile',
    home: 'https://www.roobet.com/casino',
  }

  const cases = YggdrasilUrlIntents.map(intent =>
    YggdrasilUrlRegions.map(region => [
      {
        name: `Get Url For Mobile ${intent[0].toUpperCase()}${intent.slice(
          1,
        )} in ${region[0].toUpperCase()}${region.slice(1)}`,
        intent,
        region,
        user: basicUser,
        params: paramsMobile,
      },
      {
        name: `Get Url For Desktop ${intent[0].toUpperCase()}${intent.slice(
          1,
        )} in ${region[0].toUpperCase()}${region.slice(1)}`,
        intent,
        region,
        user: basicUser,
        params: paramsDesktop,
      },
    ]).flat(),
  ).flat()

  it.each(cases)('$name', ({ intent, region, params, user }) => {
    const { url, token } = getYggdrasilLaunchUrlForUser(
      intent,
      region,
      params,
      user,
    )
    const useParams = Object.entries(params).reduce(
      (pre, cur) => ({
        ...pre,
        ...(cur[1] ? { [cur[0].toLowerCase()]: cur[1] } : {}),
      }),
      {},
    )
    const query = new URLSearchParams(useParams)
    const queryPattern = new RegExp(
      `^https.+?key=${token}&${query.toString()}$`,
    )

    expect(url).toBeDefined()
    expect(url).toBeInstanceOf(URL)

    const urlString = url.toString()
    expect(urlString).toContain('static')
    expect(urlString).toMatch(/(staging|live|pff|-co)/)
    expect(urlString).toMatch(queryPattern)
    expect(urlString).toContain(`key=${token}`)

    // Conditional expectations based on known patterns
    if (intent === 'test') {
      expect(urlString).toContain('staging')
    } else if (intent === 'live') {
      if (region === 'latam') {
        expect(urlString).toContain('static-co')
      } else {
        expect(urlString).toContain('live')
      }
    } else if (intent === 'fun') {
      expect(urlString).toContain('pff')
    }
  })
})
