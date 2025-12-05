import gql from 'graphql-tag'

export interface DetailedAddressCandidate {
  __typename: 'DetailedAddressResult'
  street: string
  locality: string
  administrative_area?: string
  postal_code?: string
  country_iso3: string
}

export interface SummaryAddressCandidate {
  __typename: 'SummaryAddressResult'
  entries: number
  address_text: string
  address_id: string
}

export interface AddressLookupResult {
  addressLookup: {
    summaryCandidates: SummaryAddressCandidate[]
    detailedCandidates: DetailedAddressCandidate[]
  }
}

export interface AddressLookupInput {
  data: {
    country: string
    search: string | null
    addressId: string | null
  }
}

export const AddressLookupMutation = gql`
  mutation AddressLookupMutation($data: AddressLookupInput!) {
    addressLookup(data: $data) {
      detailedCandidates {
        street
        locality
        administrative_area
        postal_code
      }
      summaryCandidates {
        entries
        address_text
        address_id
      }
    }
  }
`
