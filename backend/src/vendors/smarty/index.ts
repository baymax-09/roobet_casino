import {
  searchAddress,
  type LookupParams,
  type DetailedAddressResult,
  type SummaryAddressResult,
} from './lib/api'

interface LookupResult {
  detailedCandidates: DetailedAddressResult[]
  summaryCandidates: SummaryAddressResult[]
}

export const lookupAddress = async (
  lookupParams: LookupParams,
): Promise<{
  detailedCandidates: DetailedAddressResult[]
  summaryCandidates: SummaryAddressResult[]
}> => {
  const { candidates } = await searchAddress(lookupParams)

  const res = candidates.reduce<LookupResult>(
    (acc, curr) => {
      if ('entries' in curr) {
        return {
          summaryCandidates: [...acc.summaryCandidates, curr],
          detailedCandidates: acc.detailedCandidates,
        }
      } else {
        return {
          summaryCandidates: acc.summaryCandidates,
          detailedCandidates: [...acc.detailedCandidates, curr],
        }
      }
    },
    {
      summaryCandidates: [],
      detailedCandidates: [],
    },
  )

  return res
}
