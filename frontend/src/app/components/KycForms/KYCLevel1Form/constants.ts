import { type KYCRecord } from 'common/types'

export type Level1Fields = keyof typeof level1FieldDefaults
export type Level1FormValues = Required<Pick<KYCRecord, Level1Fields>>

export const DOB_FORMAT = 'DD/MM/YYYY'

export const level1FieldDefaults = {
  firstName: '',
  lastName: '',
  dob: '',
  addressLine1: '',
  addressLine2: '',
  addressCity: '',
  addressState: '',
  addressCountry: '',
  addressPostalCode: '',
  phone: '',
} as const
