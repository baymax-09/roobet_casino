import { queryField, list, nonNull, stringArg, booleanArg, intArg } from 'nexus'
import crypto from 'crypto'

import { BasicCache } from 'src/util/redisModels'

import { getGames } from 'src/modules/tp-games/documents/games'

export const TPGamesAdminQueryField = queryField('tpGamesAdmin', {
  type: nonNull(list('TPGameAdmin')),
  args: {
    limit: nonNull(intArg({ default: 0 })),
    title: stringArg(),
    provider: stringArg(),
    orderBy: stringArg(),
    category: stringArg(),
    device: stringArg(),
    search: stringArg(),
    ascending: booleanArg(),
    samples: intArg(),
  },
  description: `
  Get a list of TP Games by a combination of the following: title (game title),
  provider (third party provider, ex: BGaming), orderBy(which field to order by),
  ascending (t/f), category(slots etc), device(mobile || desktop)
  `,
  auth: {
    authenticated: false,
  },
  resolve: async (
    _,
    {
      title,
      category,
      provider,
      orderBy,
      device,
      ascending,
      search,
      limit,
      samples,
    },
  ) => {
    const positiveLimit = Math.max(limit, 0)

    const params = {
      title,
      category,
      provider,
      orderBy,
      device,
      ascending,
      search,
      limit: positiveLimit,
      samples,
    }

    const key = crypto
      .createHash('sha256')
      .update(JSON.stringify(params))
      .digest('hex')

    return await BasicCache.cached('gql:tpGames', key, 60, async () => {
      return (
        (await getGames({
          title,
          category,
          provider,
          orderBy,
          device,
          ascending,
          search,
          limit: positiveLimit,
          samples,
        })) ?? []
      )
    })
  },
})
