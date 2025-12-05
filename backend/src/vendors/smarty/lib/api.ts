import fetch from 'node-fetch'

import { config } from 'src/system'
import { smartyLogger } from './logger'

/** To retrieve summary results via string search. */
interface SummaryLookupParams {
  country: string
  search: string
}

/** To retrieve detailed candidate or further search an existing result.  */
interface DetailedLookupParams {
  country: string
  address_id: string
}

export type LookupParams = SummaryLookupParams | DetailedLookupParams

/** Detailed addresses result. */
export interface DetailedAddressResult {
  street: string
  locality: string
  administrative_area?: string
  postal_code?: string
  country_iso3: string
}

/** Smarty response if we search by address_id on a summary result with 1 entry. */
export interface DetailedLookupResult {
  candidates: [DetailedAddressResult] | []
}

/** Our api layer type for returning summary results. */
export interface SummaryAddressResult {
  entries: number
  address_text: string
  address_id: string
}

/** Summary address lookup. */
export interface SummaryLookupResult {
  candidates: SummaryAddressResult[]
}

const baseUrl =
  'https://international-autocomplete.api.smartystreets.com/v2/lookup'

const constructSearchUrl = (lookupParams: LookupParams): string => {
  const { country } = lookupParams
  const searchParams =
    'search' in lookupParams ? { search: lookupParams.search } : null
  const address_id =
    'address_id' in lookupParams ? lookupParams.address_id : null

  const params = new URLSearchParams({
    'auth-id': config.smarty.authId,
    'auth-token': config.smarty.authToken,
    country,
    ...(searchParams ?? {}),
  })

  if (address_id) {
    return `${baseUrl}/${address_id}?${params}`
  }
  return `${baseUrl}?${params}`
}

const logger = smartyLogger('searchAddress', { userId: null })

export const searchAddress = async (
  params: LookupParams,
): Promise<SummaryLookupResult | DetailedLookupResult> => {
  const url = constructSearchUrl(params)

  const request = await fetch(url)

  if (!request.ok) {
    logger.error('Failed to load results from Smarty.', await request.json())
    return { candidates: [] }
  }

  const result = await request.json()

  return result
}
