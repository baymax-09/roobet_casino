import { objectType } from 'nexus'

const DetailedAddressResultType = objectType({
  name: 'DetailedAddressResult',
  description:
    'A detailed search result from Smarty with the address broken into fields.',
  definition(type) {
    type.nonNull.string('street')
    type.nonNull.string('locality')
    type.string('administrative_area')
    type.string('postal_code')
  },
})

const SummaryAddressResultType = objectType({
  name: 'SummaryAddressResult',
  description:
    'An initial search result from Smarty that can be refined to detailed results if entries is 1.',
  definition(type) {
    type.nonNull.int('entries')
    type.nonNull.string('address_text')
    type.string('address_id')
  },
})

export const AddressLookupType = objectType({
  name: 'AddressLookup',
  definition: type => {
    type.nonNull.list.field('summaryCandidates', {
      auth: null,
      description: 'List of possible address candidate matches.',
      type: SummaryAddressResultType,
    })
    type.nonNull.list.field('detailedCandidates', {
      auth: null,
      description: 'List of detailed address candidates based on address_id.',
      type: DetailedAddressResultType,
    })
  },
})
