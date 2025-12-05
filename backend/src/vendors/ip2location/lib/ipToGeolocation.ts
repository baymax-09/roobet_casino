import { getIp2Location, getRegionLookupData } from './databases'

export const getCountryCodeFromIP = async (
  ipAddress: string,
): Promise<string | null> => {
  const countryCode = (await getIp2Location())?.getCountryShort(ipAddress)

  if (!countryCode || countryCode.match('INVALID')) {
    return null
  }

  return countryCode
}

const getRegionByIp = async (
  ipAddress: string,
): Promise<string | undefined> => {
  return (await getIp2Location())?.getRegion(ipAddress)
}

export const getRegionCode = async (
  ipAddress: string,
  countryCode: string | null,
): Promise<string | null> => {
  if (countryCode === null) {
    return null
  }

  const regionLookupData = await getRegionLookupData()

  if (!regionLookupData) {
    return null
  }

  const region = await getRegionByIp(ipAddress)

  const data = regionLookupData
    .filter(row => row.country_code === countryCode)
    .filter(row => row.subdivision_name === region)

  if (data.length === 0) {
    return null
  }

  return data[0].code
}
