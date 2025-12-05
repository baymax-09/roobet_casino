import fs from 'fs'
import csv from 'csvtojson'
import { IP2Location } from 'ip2location-nodejs'

import { config } from 'src/system'
import { ip2LocLogger } from './logger'

interface RegionCodeData {
  country_code: string
  subdivision_name: string
  code: string
}

const IP2_GEO_BIN_PATH = !config.isLocal
  ? '/data/ipGeo.bin'
  : './artifacts/ipGeo.bin'
const ISO_REGION_CSV_PATH = !config.isLocal
  ? '/data/iso3166-2.csv'
  : './artifacts/iso3166-2.csv'

/*
 * Docs for ip2Location API:
 * https://github.com/ip2location/ip2location-nodejs
 */
let ip2location: IP2Location | null = new IP2Location()
let regionData: RegionCodeData[] | null = null

let locDbLoaded = false
let regionDbLoaded = false

const fileExists = async (path: string): Promise<boolean> =>
  await new Promise(resolve => {
    fs.access(path, err => {
      if (err) {
        resolve(false)
        return
      }

      resolve(true)
    })
  })

export const getRegionLookupData = async (): Promise<
  RegionCodeData[] | null
> => {
  if (regionDbLoaded) {
    return regionData
  }

  try {
    // Await result in try/catch as to not bubble up error.
    const result: RegionCodeData[] = await csv().fromFile(ISO_REGION_CSV_PATH)

    // Add result to top-level scoped variable.
    regionData = result
  } catch (err) {
    ip2LocLogger('getRegionLookupData', { userId: null }).error(
      `Unable to load ISO-3166-2 database with path ${ISO_REGION_CSV_PATH}`,
    )

    // Ignore errors for worker deployments.
    if (config.worker) {
      regionDbLoaded = true
    }
  }

  return regionData
}

export const getIp2Location = async (): Promise<IP2Location | null> => {
  if (locDbLoaded) {
    return ip2location
  }

  const exists = await fileExists(IP2_GEO_BIN_PATH)

  // Ignore errors for worker deployments.
  if (!exists && config.worker) {
    ip2location = null
    locDbLoaded = true

    return ip2location
  }

  if (!exists) {
    ip2LocLogger('getIp2Location', { userId: null }).error(
      `Unable to load IP geo database with path ${IP2_GEO_BIN_PATH}.`,
    )
  }

  ip2location?.open(IP2_GEO_BIN_PATH)
  locDbLoaded = true

  return ip2location
}
