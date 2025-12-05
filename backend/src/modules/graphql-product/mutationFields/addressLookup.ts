import { mutationField, inputObjectType, nonNull } from 'nexus'
import { RateLimiterRedis } from 'rate-limiter-flexible'

import { cacheClient } from 'src/system'
import { lookupAddress } from 'src/vendors/smarty'

const ipRateLimiter = new RateLimiterRedis({
  storeClient: cacheClient(),
  points: 2, // Max message per duration
  duration: 1, // Per second(s)
  keyPrefix: 'smarty-address-lookup-ip',
})

const AddressLookupInput = inputObjectType({
  name: 'AddressLookupInput',
  definition: type => {
    type.nonEmptyString('search', {
      auth: null,
      description: 'Address search string.',
    })
    type.nonNull.nonEmptyString('country', {
      auth: null,
      description: 'ISO Alpha 3 country code.',
    })
    type.nonEmptyString('addressId', {
      auth: null,
      description: 'Id for detailed address lookup.',
    })
  },
})

export const AddressLookupMutationField = mutationField('addressLookup', {
  description: 'Looks up addresses by searching partial strings.',
  type: 'AddressLookup',
  args: {
    data: nonNull(AddressLookupInput),
  },
  auth: {
    authenticated: true,
  },
  resolve: async (_, { data }, { requestingIp }) => {
    const { search, country, addressId } = data

    // Rate limit requests.
    // TODO: Move to graphql plugin.
    try {
      await ipRateLimiter.consume(requestingIp)
    } catch {
      return { summaryCandidates: [], detailedCandidates: [] }
    }

    return await lookupAddress({
      search,
      country,
      // @ts-expect-error need to fix now that we have types
      address_id: addressId,
    })
  },
})
