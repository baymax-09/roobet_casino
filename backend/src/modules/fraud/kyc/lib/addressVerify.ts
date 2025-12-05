import iso3311a2 from 'iso-3166-1-alpha-2'

import { type UserDocuments } from 'src/modules/user/types'

import { type KYCRecord } from '../types'

export function getAddressFromKyc(kyc: KYCRecord): string {
  const address = `${kyc.addressLine1 || ''} ${kyc.addressLine2 || ''}, ${
    kyc.addressCity || ''
  }, ${kyc.addressState || ''}, ${
    iso3311a2.getCountry(kyc.addressCountry || '') || ''
  }`
  return address
}

export function isPoaDocument(userKycDocument: UserDocuments): boolean {
  return userKycDocument.type === 'address'
}
