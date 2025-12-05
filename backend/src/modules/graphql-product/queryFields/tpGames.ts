import { queryField, list, nonNull, stringArg, booleanArg, intArg } from 'nexus'
import { GraphQLError } from 'graphql'

import { getGames } from 'src/modules/tp-games/documents/games'

export const TPGamesQueryField = queryField('tpGames', {
  type: nonNull(list('TPGame')),
  args: {
    limit: nonNull(intArg({ default: 0 })),
    page: nonNull(intArg({ default: 0 })),
    title: stringArg(),
    provider: stringArg(),
    orderBy: stringArg(),
    category: stringArg(),
    device: stringArg(),
    search: stringArg(),
    ascending: booleanArg(),
    samples: intArg(),
    providers: list(nonNull(stringArg())),
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
      providers,
      orderBy,
      device,
      ascending,
      search,
      limit,
      page,
      samples,
    },
  ) => {
    if (page < 0) {
      throw new GraphQLError('api__invalid_param')
    }

    if (limit < 0 || limit > 100) {
      throw new GraphQLError('api__invalid_param')
    }

    return await getGames({
      title,
      category,
      provider,
      providers,
      orderBy,
      device,
      ascending,
      search,
      limit,
      page,
      samples,
    })
  },
})
