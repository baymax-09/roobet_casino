import { getCRMByUserId } from 'src/modules/crm/documents/crm'
import { getUserFiatCurrency } from 'src/modules/currency/types'
import { getForUser } from 'src/modules/fraud/kyc/documents/kyc'
import { getUserById, userIsLocked } from 'src/modules/user'

/**
 * Even though most of these fields are "required", it seems that you can send "" if you don't have the info
 */
export interface UserDetails {
  address: string
  birth_date: string // YYYY-MM-DD
  city: string
  country: string // XY
  currency: string // USD
  email: string
  first_name: string
  is_blocked: boolean
  is_excluded: boolean
  language: string // en
  last_name: string
  mobile: string
  mobile_prefix: string
  origin: string
  postal_code: string
  roles: string[]
  sex: 'Female' | 'Male' | ''
  title: string
  user_id: string
  username: string
  verified_at?: string // '2015-03-02T08:27:58.721607Z'
  registration_code: string
  registration_date?: string // '2015-03-02T08:27:58.721607Z'
  affiliate_reference: string
  market: string
  segmentation?: Record<string, any>
}

export const getUserDetails = async (
  userId: string,
): Promise<UserDetails | null> => {
  const user = await getUserById(userId)

  const crms = await getCRMByUserId(userId)

  const roles = Object.keys({
    ...(user?.isSponsor && { Sponsor: true }),
    ...(user?.isMarketing && { Marketing: true }),
    ...(crms?.marketing_influencer && { Influencer: true }),
    ...(user?.role && user.role === 'HV' && { HV: true }),
    ...(user?.role && user.role === 'VIP' && { VIP: true }),
    ...(user?.role && user.role === 'PL' && { PL: true }),
    ...(user?.role && user.role === 'CS' && { CS: true }),
    ...(user?.role && user.role === 'PLI' && { PLI: true }),
  })

  // We want to send user details, even if a user is not found, to avoid the FT queue getting stuck
  if (!user) {
    return {
      address: '',
      birth_date: '',
      city: 'N/A',
      last_name: 'N/A',
      first_name: 'N/A',
      country: 'N/A',
      currency: 'N/A',
      email: 'N/A',
      is_blocked: true,
      is_excluded: true,
      language: 'N/A',
      mobile: 'N/A',
      mobile_prefix: '',
      origin: 'N/A',
      postal_code: '',
      roles: [],
      sex: '',
      title: '',
      user_id: userId,
      username: 'Deleted user',
      registration_code: '',
      registration_date: new Date().toISOString(),
      affiliate_reference: '',
      market: '',
    }
  }

  const kyc = await getForUser(user)

  const userIsBlocked = await userIsLocked(user)

  const affiliateData = (() => {
    if (crms?.cxAffId) {
      return crms.cxAffId
    }
    if (user.affiliateId) {
      return user.affiliateId
    }
    return ''
  })()

  const segmentation = {
    isPromoBanned: user.isPromoBanned ?? false,
  }

  return {
    address: '',
    birth_date: '',
    // TODO: Uncomment once ROOB-1920 gets merged ????
    // birth_date: kyc.dob ? formatKYCDob(kyc.dob) : '', ????
    city: '',
    last_name: kyc.lastName ?? '',
    first_name: kyc.firstName ?? '',
    country: user.countryCode,
    currency: getUserFiatCurrency(userId),
    email: user.email,
    is_blocked: userIsBlocked,
    is_excluded: false,
    language: user.locale ?? 'en',
    mobile: kyc.phone ?? '',
    mobile_prefix: '',
    origin: 'roobet.com', // TODO handle other origins
    postal_code: '',
    roles,
    sex: '',
    title: '',
    user_id: userId,
    username: user.name,
    registration_code: '',
    registration_date: new Date(user.createdAt).toISOString(),
    affiliate_reference: affiliateData,
    market: '',
    segmentation,
  }
}

const ValidUserDetailFields = [
  'name',
  'createdAt',
  'locale',
  'emailVerified',
  'email',
  'countryCode',
  'lockedUntil',
  'isSponsor',
  'isMarketing',
  'role',
  'affiliateId',
  'isPromoBanned',
] as const
type ValidUserDetailField = (typeof ValidUserDetailFields)[number]
export const isValidUserDetailField = (
  field: any,
): field is ValidUserDetailField => {
  return ValidUserDetailFields.includes(field)
}
