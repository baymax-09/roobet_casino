import { type Request } from 'express'

import { first } from 'src/util/helpers/lists'
import { config } from 'src/system'
import { getCountryCodeFromIP, getRegionCode } from 'src/vendors/ip2location'
import { type User } from 'src/modules/user/types'
import { type Handshake } from 'socket.io/dist/socket'
import { fraudLogger } from '../../lib/logger'

type RequestOrHandshake = Request | Handshake

// Cloudflare DNS.
const DEFAULT_REQUESTING_IP = '1.1.1.1'

// Roobet VPN (Montreal, CA).
const ALLOWLIST_REQUESTING_IP = '51.79.74.49'

const ALLOWED_USER_GROUPS: Record<
  string,
  {
    shouldLog: boolean
    check: ({ user, ip }: { user: User | undefined; ip: string }) => boolean
  }
> = {
  local: {
    shouldLog: false,
    check: () => {
      return config.isLocal
    },
  },
  staging: {
    shouldLog: false,
    check: () => {
      return config.isStaging
    },
  },
  dev: {
    shouldLog: true,
    check: ({ user }) => {
      return user?.department === 'Dev'
    },
  },
  staff: {
    shouldLog: true,
    check: ({ user }) => {
      return !!user?.staff
    },
  },
  allowedIPs: {
    shouldLog: true,
    check: ({ ip }) => {
      return config.appSettings.allowedIPs.includes(ip)
    },
  },
}

export const getRawIpFromRequest = (
  req: RequestOrHandshake,
  defaultIp: string = DEFAULT_REQUESTING_IP,
): string => {
  return first(req.headers['cf-connecting-ip']) ?? defaultIp
}

export const getIpFromRequest = async (
  req: RequestOrHandshake,
  defaultIp: string = DEFAULT_REQUESTING_IP,
): Promise<string> => {
  // Only use the allowed ip (Canada) if the country the staff user is in is blocked
  if (isRequestingUserAllowed(req)) {
    const isCountryBlocked = await isStaffCountryBlocked(req, [])
    if (isCountryBlocked) {
      return ALLOWLIST_REQUESTING_IP
    }
  }

  return getRawIpFromRequest(req, defaultIp)
}

export const isRequestingUserAllowed = (req: RequestOrHandshake): boolean => {
  const ip = getRawIpFromRequest(req)

  // @ts-expect-error user not on Handshake
  const { user } = req

  const firstAllowedGroup = Object.entries(ALLOWED_USER_GROUPS).find(
    ([groupName, group]) => {
      const foundGroup = group.check({
        ip,
        user,
      })
      if (foundGroup && group.shouldLog) {
        fraudLogger('isRequestingUserAllowed', { userId: user.id }).info(
          `geofencing allowlist - excepting userId: ${user?.id} ip: ${ip} in ${groupName} group`,
          { groupName, ip },
        )
      }
      return foundGroup
    },
  )

  return !!firstAllowedGroup
}

export const getCountryCodeFromRequest = async (req: Request) => {
  const ip = await getIpFromRequest(req)

  return first(req.headers['cf-ipcountry']) ?? (await getCountryCodeFromIP(ip))
}

export const isIpAddressBlocked = async (
  ipAddress: string,
  blockedCountries: string[],
  country?: string | null,
): Promise<boolean> => {
  const countryCode = country || (await getCountryCodeFromIP(ipAddress))

  // If we cannot lookup country by ip, assume the IP is blocked.
  if (!countryCode) {
    return true
  }

  const regionCode = await getRegionCode(ipAddress, countryCode)

  if (!regionCode) {
    return blockedCountries.includes(countryCode)
  }

  return (
    blockedCountries.includes(countryCode) ||
    blockedCountries.includes(regionCode)
  )
}

export const isStaffCountryBlocked = async (
  req: RequestOrHandshake,
  blockedCountries: string[] = [],
) => {
  const ip = getRawIpFromRequest(req)
  const countryCode =
    first(req.headers['cf-ipcountry']) ?? (await getCountryCodeFromIP(ip))

  const isCountryBlocked = await (async () => {
    const systemBlockedCountryCodes = Object.keys(config.countryBlocks.list)
    const fullBlockedList = [
      ...new Set(blockedCountries.concat(systemBlockedCountryCodes)),
    ]

    return await isIpAddressBlocked(ip, fullBlockedList, countryCode)
  })()

  return isCountryBlocked
}

export const isCountryBanned = async (
  req: Request,
  blockedCountries: string[] = [],
): Promise<boolean> => {
  if (isRequestingUserAllowed(req)) {
    return false
  }

  if (config.isLocal) {
    return false
  }

  const ip = await getIpFromRequest(req)
  const countryCode = await getCountryCodeFromRequest(req)

  const isCountryBlocked = await (async () => {
    const systemBlockedCountryCodes = Object.keys(config.countryBlocks.list)
    const fullBlockedList = [
      ...new Set(blockedCountries.concat(systemBlockedCountryCodes)),
    ]

    return await isIpAddressBlocked(ip, fullBlockedList, countryCode)
  })()

  return isCountryBlocked
}
