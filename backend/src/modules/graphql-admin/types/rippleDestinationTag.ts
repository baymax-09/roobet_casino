import { objectType } from 'nexus'

export const RippleDestinationTagType = objectType({
  name: 'RippleDestinationTag',
  description: 'Ripple Destination Tag for User',
  definition(type) {
    type.nonNull.string('id', {
      auth: null,
    })
    type.nonNull.int('destinationTag', {
      auth: null,
    })
    type.nonNull.string('userId', {
      auth: null,
    })
    type.nonNull.string('destinationAddress', {
      auth: null,
    })
    type.nonNull.string('type', {
      auth: null,
    })
  },
})
